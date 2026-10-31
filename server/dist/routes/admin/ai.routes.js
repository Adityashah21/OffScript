import { Router } from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { fileURLToPath } from "url";
import { aiTryonService, PRESET_MODELS, TRYON_ANGLES } from "../../services/aiTryon.js";
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
        cb(null, `model-${randomName}${ext}`);
    },
});
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (_req, file, cb) => {
        const allowed = ["image/jpeg", "image/png", "image/webp"];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new AppError(400, "INVALID_FILE_TYPE", "Only JPG, PNG, and WebP images are allowed"));
        }
    },
});
export const adminAiRouter = Router();
/**
 * GET /api/admin/ai/presets
 * Returns available curated preset models and angle definitions
 */
adminAiRouter.get("/presets", (_req, res) => {
    res.json({
        presetModels: PRESET_MODELS,
        angles: TRYON_ANGLES,
        hasServerKey: Boolean(process.env.GEMINI_API_KEY),
        storageProvider: storageService.isCloud() ? "cloudinary" : "local",
    });
});
/**
 * POST /api/admin/ai/verify-key
 * Validates Gemini API Key against Google's API and returns operational status
 */
adminAiRouter.post("/verify-key", async (req, res) => {
    const key = (req.body.apiKey || process.env.GEMINI_API_KEY || "").trim();
    if (!key) {
        return res.status(400).json({ valid: false, error: "No API key provided" });
    }
    try {
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey: key });
        const testRes = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: [{ role: "user", parts: [{ text: "ping" }] }],
        });
        if (testRes.text) {
            return res.json({
                valid: true,
                message: "Gemini API connection verified! Ready for AI model synthesis.",
            });
        }
        return res.json({ valid: true, message: "Gemini key accepted." });
    }
    catch (err) {
        return res.status(400).json({
            valid: false,
            error: err?.message || "Failed to connect to Google Gemini API",
        });
    }
});
/**
 * POST /api/admin/ai/upload-model
 * Allows admin to upload their own model photo to cloud/local storage
 */
adminAiRouter.post("/upload-model", upload.single("image"), async (req, res, next) => {
    try {
        if (!req.file) {
            throw new AppError(400, "FILE_REQUIRED", "No model image provided");
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
/**
 * POST /api/admin/ai/generate
 * Generates 4 angle try-on photographs using Gemini API and Imagen 3
 */
adminAiRouter.post("/generate", async (req, res, next) => {
    try {
        const { modelImage, productImage, productName, category, aesthetic, geminiApiKey, angles, } = req.body;
        if (!productImage) {
            throw new AppError(400, "PRODUCT_IMAGE_REQUIRED", "Product garment image is required");
        }
        if (!productName) {
            throw new AppError(400, "PRODUCT_NAME_REQUIRED", "Product name is required");
        }
        const result = await aiTryonService.generateMultiAngleShots({
            modelImage,
            productImage,
            productName,
            category: category || "Streetwear",
            aesthetic,
            geminiApiKey,
            angles,
        });
        res.json(result);
    }
    catch (error) {
        next(error);
    }
});
