import path from "path";
import fs from "fs";
import { Readable } from "stream";
import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";
export class LocalStorageService {
    isCloud() {
        return false;
    }
    async saveFile(file) {
        const filename = path.basename(file.path);
        return `${env.PUBLIC_BASE_URL}/static/${filename}`;
    }
    async saveBuffer(buffer, filename, _mimetype) {
        const uploadsDir = path.resolve(process.cwd(), "uploads");
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const safeFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const filePath = path.join(uploadsDir, safeFilename);
        await fs.promises.writeFile(filePath, buffer);
        return `${env.PUBLIC_BASE_URL}/static/${safeFilename}`;
    }
}
export class CloudinaryStorageService {
    constructor() {
        if (env.CLOUDINARY_URL) {
            cloudinary.config({ cloudinary_url: env.CLOUDINARY_URL });
        }
        else {
            cloudinary.config({
                cloud_name: env.CLOUDINARY_CLOUD_NAME,
                api_key: env.CLOUDINARY_API_KEY,
                api_secret: env.CLOUDINARY_API_SECRET,
                secure: true,
            });
        }
    }
    isCloud() {
        return true;
    }
    async saveFile(file) {
        try {
            const result = await cloudinary.uploader.upload(file.path, {
                folder: "offscript/products",
                resource_type: "image",
                transformation: [{ quality: "auto:good", fetch_format: "auto" }],
            });
            // Remove local temp multer upload asynchronously
            fs.promises.unlink(file.path).catch(() => { });
            return result.secure_url;
        }
        catch (err) {
            console.error("❌ Cloudinary saveFile error:", err);
            // Fallback to local storage if Cloudinary fails
            const filename = path.basename(file.path);
            return `${env.PUBLIC_BASE_URL}/static/${filename}`;
        }
    }
    async saveBuffer(buffer, filename, _mimetype) {
        return new Promise((resolve, reject) => {
            const cleanName = path.parse(filename).name.replace(/[^a-zA-Z0-9_-]/g, "_");
            const publicId = `${cleanName}-${Date.now()}`;
            const uploadStream = cloudinary.uploader.upload_stream({
                folder: "offscript/ai-models",
                resource_type: "image",
                public_id: publicId,
                transformation: [{ quality: "auto:good", fetch_format: "auto" }],
            }, (error, result) => {
                if (error || !result) {
                    console.error("❌ Cloudinary upload_stream error:", error);
                    // Fallback to local buffer save
                    new LocalStorageService()
                        .saveBuffer(buffer, filename, _mimetype)
                        .then(resolve)
                        .catch(reject);
                    return;
                }
                resolve(result.secure_url);
            });
            const readable = new Readable();
            readable.push(buffer);
            readable.push(null);
            readable.pipe(uploadStream);
        });
    }
}
const isCloudinaryConfigured = Boolean(env.CLOUDINARY_URL ||
    (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET));
if (isCloudinaryConfigured) {
    console.log("☁️  Cloudinary cloud storage initialized for persistent product images.");
}
else {
    console.log("ℹ️  Cloudinary credentials not detected. Falling back to local disk storage (/uploads). For persistent images on Render, set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.");
}
export const storageService = isCloudinaryConfigured
    ? new CloudinaryStorageService()
    : new LocalStorageService();
