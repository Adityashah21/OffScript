import { Router } from "express";
import mongoose from "mongoose";
import crypto from "crypto";
import { Product } from "../models/Product.js";
import { AffiliateClick } from "../models/AffiliateClick.js";
import { AppError } from "../middleware/errorHandler.js";
import { affiliateRedirectLimiter } from "../middleware/rateLimiters.js";
export const affiliateRouter = Router();
function hashIp(ip) {
    return crypto.createHash("sha256").update(`${ip}:offscript-affiliate`).digest("hex");
}
function isValidHttpUrl(urlString) {
    try {
        const url = new URL(urlString);
        return url.protocol === "http:" || url.protocol === "https:";
    }
    catch {
        return false;
    }
}
// Handler for affiliate redirect
export async function handleAffiliateRedirect(req, res, next) {
    try {
        const rawId = req.params.id || req.params.slug;
        const idOrSlug = (Array.isArray(rawId) ? rawId[0] : rawId || "").trim();
        if (!idOrSlug) {
            throw new AppError(400, "MISSING_IDENTIFIER", "Product identifier required");
        }
        let product = null;
        if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
            product = await Product.findById(idOrSlug);
        }
        if (!product) {
            product = await Product.findOne({ slug: idOrSlug.toLowerCase() });
        }
        if (!product) {
            throw new AppError(404, "PRODUCT_NOT_FOUND", "Piece not found in catalog");
        }
        if (product.purchaseMode !== "affiliate" || !product.affiliateUrl) {
            throw new AppError(404, "AFFILIATE_NOT_AVAILABLE", "This piece is not available via affiliate redirect");
        }
        // Anti-open-redirect validation: target must be valid absolute http/https URL
        if (!isValidHttpUrl(product.affiliateUrl)) {
            throw new AppError(400, "INVALID_REDIRECT_URL", "Configured merchant affiliate destination is invalid");
        }
        // Extract UTM attribution from query parameters without personal data
        const attribution = {};
        for (const [key, val] of Object.entries(req.query)) {
            if (typeof val === "string" && key.startsWith("utm_")) {
                attribution[key] = val;
            }
        }
        const clientIp = req.ip || req.socket.remoteAddress || "127.0.0.1";
        const userAgent = req.get("user-agent") || "unknown";
        // Record affiliate click asynchronously (non-blocking)
        AffiliateClick.create({
            productId: String(product.id || product._id),
            productSlug: product.slug,
            retailer: product.retailer || product.brand || "OFFSCRIPT",
            destinationUrl: product.affiliateUrl,
            ipHash: hashIp(clientIp),
            userAgent: userAgent.slice(0, 200),
            attribution: Object.keys(attribution).length > 0 ? attribution : undefined,
            timestamp: new Date(),
        }).catch((err) => console.error("Failed to record affiliate click:", err));
        // 302 redirect to verified merchant affiliate link
        res.redirect(302, product.affiliateUrl);
    }
    catch (error) {
        next(error);
    }
}
// 1. Conceptual endpoint specified in brief: GET /api/affiliate/redirect/:id
affiliateRouter.get("/redirect/:id", affiliateRedirectLimiter, handleAffiliateRedirect);
// 2. Backwards-compatible slug endpoint: GET /api/r/:slug or GET /r/:slug
affiliateRouter.get("/:slug", affiliateRedirectLimiter, handleAffiliateRedirect);
