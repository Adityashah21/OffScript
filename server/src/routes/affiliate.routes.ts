import { Router, type Request, type Response, type NextFunction } from "express";
import { Product } from "../models/Product.js";
import { AffiliateClick } from "../models/AffiliateClick.js";
import { AppError } from "../middleware/errorHandler.js";

export const affiliateRouter = Router();

// Handler for affiliate redirect
export async function handleAffiliateRedirect(req: Request, res: Response, next: NextFunction) {
  try {
    const slug = req.params.slug;
    const product = await Product.findOne({ slug });

    if (!product) {
      throw new AppError(404, "PRODUCT_NOT_FOUND", "Piece not found");
    }

    if (product.purchaseMode !== "affiliate" || !product.affiliateUrl) {
      throw new AppError(
        404,
        "AFFILIATE_NOT_AVAILABLE",
        "This piece is not available via affiliate redirect"
      );
    }

    // Extract UTM attribution from query parameters without personal data
    const attribution: Record<string, string> = {};
    for (const [key, val] of Object.entries(req.query)) {
      if (typeof val === "string" && key.startsWith("utm_")) {
        attribution[key] = val;
      }
    }

    // Record affiliate click asynchronously
    AffiliateClick.create({
      productSlug: product.slug,
      retailer: product.retailer,
      attribution: Object.keys(attribution).length > 0 ? attribution : undefined,
      timestamp: new Date(),
    }).catch((err) => console.error("Failed to record affiliate click:", err));

    // 302 redirect to retailer affiliate link
    res.redirect(302, product.affiliateUrl);
  } catch (error) {
    next(error);
  }
}

affiliateRouter.get("/:slug", handleAffiliateRedirect);
