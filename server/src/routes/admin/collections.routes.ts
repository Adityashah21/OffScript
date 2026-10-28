import { Router, type Request, type Response, type NextFunction } from "express";
import { Collection } from "../../models/Collection.js";
import { collectionSchema } from "../../schemas/collection.schema.js";
import { AppError } from "../../middleware/errorHandler.js";

export const adminCollectionsRouter = Router();

// GET /api/admin/collections
adminCollectionsRouter.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const collections = await Collection.find().sort({ createdAt: -1 });
    res.json(collections.map((c) => c.toJSON()));
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/collections
adminCollectionsRouter.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = collectionSchema.parse(req.body);

    const existing = await Collection.findOne({ slug: data.slug });
    if (existing) {
      throw new AppError(409, "SLUG_EXISTS", "Collection slug already exists");
    }

    const col = new Collection(data);
    await col.save();

    res.status(201).json(col.toJSON());
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/collections/:slug
adminCollectionsRouter.get("/:slug", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const col = await Collection.findOne({ slug: req.params.slug });
    if (!col) {
      throw new AppError(404, "COLLECTION_NOT_FOUND", "Collection not found");
    }
    res.json(col.toJSON());
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/collections/:slug
adminCollectionsRouter.put("/:slug", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = collectionSchema.parse(req.body);

    const col = await Collection.findOne({ slug: req.params.slug });
    if (!col) {
      throw new AppError(404, "COLLECTION_NOT_FOUND", "Collection not found");
    }

    if (data.slug !== req.params.slug) {
      const collision = await Collection.findOne({ slug: data.slug });
      if (collision) {
        throw new AppError(409, "SLUG_EXISTS", "New slug already exists");
      }
    }

    Object.assign(col, data);
    await col.save();

    res.json(col.toJSON());
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/collections/:slug
adminCollectionsRouter.delete("/:slug", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const col = await Collection.findOneAndDelete({ slug: req.params.slug });
    if (!col) {
      throw new AppError(404, "COLLECTION_NOT_FOUND", "Collection not found");
    }
    res.json({ success: true, deletedSlug: req.params.slug });
  } catch (error) {
    next(error);
  }
});
