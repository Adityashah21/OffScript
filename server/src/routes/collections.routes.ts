import { Router, type Request, type Response, type NextFunction } from "express";
import { Collection, type ICollection } from "../models/Collection.js";
import { Product } from "../models/Product.js";
import { buildMongoFilter } from "../services/collectionMatcher.js";
import { AppError } from "../middleware/errorHandler.js";

export const collectionsRouter = Router();

// GET /api/collections
collectionsRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const surface = typeof req.query.surface === "string" ? req.query.surface : undefined;
    const collections = await Collection.find();

    // Map each collection with its productCount
    const withCounts = await Promise.all(
      collections.map(async (col) => {
        const filter = buildMongoFilter(col.match);
        const productCount = await Product.countDocuments(filter);
        return {
          ...(col.toJSON() as ICollection),
          productCount,
        };
      })
    );

    if (surface && ["trend", "occasion", "mood"].includes(surface)) {
      const filtered = withCounts
        .filter((col) => col.placements.some((p) => p.surface === surface))
        .map((col) => {
          const placement = col.placements.find((p) => p.surface === surface)!;
          return {
            ...col,
            label: placement.label,
            note: placement.note,
            order: placement.order,
          };
        })
        .sort((a, b) => a.order - b.order);

      res.json(filtered);
      return;
    }

    res.json(withCounts);
  } catch (error) {
    next(error);
  }
});

// GET /api/collections/:slug
collectionsRouter.get("/:slug", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const col = await Collection.findOne({ slug: req.params.slug });
    if (!col) {
      throw new AppError(404, "COLLECTION_NOT_FOUND", "Collection not found");
    }

    const filter = buildMongoFilter(col.match);
    const productCount = await Product.countDocuments(filter);

    res.json({
      ...(col.toJSON() as ICollection),
      productCount,
    });
  } catch (error) {
    next(error);
  }
});
