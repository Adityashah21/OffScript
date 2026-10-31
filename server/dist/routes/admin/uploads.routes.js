import { Router } from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { fileURLToPath } from "url";
import { storageService } from "../../services/storage.js";
import { AppError } from "../../middleware/errorHandler.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, "../../../uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const randomName = crypto.randomBytes(16).toString("hex");
        cb(null, `${randomName}${ext}`);
    },
});
const fileFilter = (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new AppError(400, "INVALID_FILE_TYPE", "Only JPG, PNG, and WebP images are allowed"));
    }
};
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
    fileFilter,
});
export const adminUploadsRouter = Router();
// GET /api/admin/uploads/status
adminUploadsRouter.get("/status", (_req, res) => {
    res.json({
        provider: storageService.isCloud() ? "cloudinary" : "local",
        isCloud: storageService.isCloud(),
        message: storageService.isCloud()
            ? "Cloudinary cloud storage is active"
            : "Local disk storage active. Add CLOUDINARY_* environment variables for permanent cloud CDN.",
    });
});
// POST /api/admin/uploads
adminUploadsRouter.post("/", upload.single("image"), async (req, res, next) => {
    try {
        if (!req.file) {
            throw new AppError(400, "FILE_REQUIRED", "No image file provided");
        }
        const fileUrl = await storageService.saveFile(req.file);
        res.status(201).json({
            url: fileUrl,
            filename: req.file.filename,
            mimetype: req.file.mimetype,
            size: req.file.size,
        });
    }
    catch (error) {
        next(error);
    }
});
