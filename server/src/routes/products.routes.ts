import { Router, type Request, type Response, type NextFunction } from "express";
import { Product } from "../models/Product.js";
import { queryProducts, getFilterOptions, getProductRails } from "../services/productQuery.js";
import { AppError } from "../middleware/errorHandler.js";

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
    const result = await queryProducts(req.query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/products/:slug
productsRouter.get("/:slug", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug });
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
