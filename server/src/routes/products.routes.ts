import { Router, type Request, type Response, type NextFunction } from "express";
import { Product } from "../models/Product.js";
import { queryProducts, getFilterOptions, getProductRails } from "../services/productQuery.js";
import { AppError } from "../middleware/errorHandler.js";
import { seed } from "../scripts/seed.js";
import { getSeedProducts } from "../scripts/seedData.js";
import { env } from "../config/env.js";

export const productsRouter = Router();

// GET /api/products/filters
productsRouter.get("/filters", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const collectionSlug = typeof req.query.collection === "string" ? req.query.collection : undefined;
    const filters = await getFilterOptions(collectionSlug);
    res.json(filters);
  } catch (error) {
    next(error);
  }
});

// GET /api/products
productsRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    let result = await queryProducts(req.query);
    if (result.total === 0 && (!req.query || Object.keys(req.query).length === 0)) {
      const count = await Product.countDocuments();
      if (count === 0) {
        try {
          console.log("Auto-seeding catalog on first GET /api/products request...");
          await seed();
          result = await queryProducts(req.query);
        } catch (seedErr) {
          console.error("Auto-seed error on GET /api/products:", seedErr);
        }
      }
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/products/:slug
productsRouter.get("/:slug", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawSlug = req.params.slug;
    const slug = (Array.isArray(rawSlug) ? rawSlug[0] : rawSlug || "").trim();
    let product = await Product.findOne({ slug });
    if (!product) {
      product = await Product.findOne({ slug: new RegExp(`^${slug}$`, "i") });
    }
    if (!product) {
      // Fallback: check seed products
      const seedProducts = getSeedProducts(env.PUBLIC_BASE_URL);
      const foundSeed = seedProducts.find(
        (p) => p.slug.toLowerCase() === slug.toLowerCase()
      );
      if (foundSeed) {
        product = await Product.findOneAndUpdate(
          { slug: foundSeed.slug },
          { $setOnInsert: foundSeed },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
    }

    if (!product) {
      throw new AppError(404, "PRODUCT_NOT_FOUND", "Piece not found");
    }

    const rails = await getProductRails(product);
    res.json({
      ...product.toJSON(),
      ...rails,
    });
  } catch (error) {
    next(error);
  }
});
