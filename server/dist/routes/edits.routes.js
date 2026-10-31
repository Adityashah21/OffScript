import { Router } from "express";
import { Edit } from "../models/Edit.js";
import { Collection } from "../models/Collection.js";
import { Product } from "../models/Product.js";
import { buildMongoFilter } from "../services/collectionMatcher.js";
import { AppError } from "../middleware/errorHandler.js";
export const editsRouter = Router();
async function resolveCollectionWithCount(slug) {
    const col = await Collection.findOne({ slug });
    if (!col)
        return null;
    const count = await Product.countDocuments(buildMongoFilter(col.match));
    return {
        ...col.toJSON(),
        productCount: count,
    };
}
// GET /api/edits
editsRouter.get("/", async (_req, res, next) => {
    try {
        const edits = await Edit.find();
        const resolvedEdits = await Promise.all(edits.map(async (edit) => {
            const primaryCollection = await resolveCollectionWithCount(edit.collection);
            const relatedCollections = (await Promise.all(edit.related.map((s) => resolveCollectionWithCount(s)))).filter(Boolean);
            return {
                ...edit.toJSON(),
                collection: primaryCollection,
                relatedCollections,
            };
        }));
        res.json(resolvedEdits);
    }
    catch (error) {
        next(error);
    }
});
// GET /api/edits/:slug
editsRouter.get("/:slug", async (req, res, next) => {
    try {
        const edit = await Edit.findOne({ slug: req.params.slug });
        if (!edit) {
            throw new AppError(404, "EDIT_NOT_FOUND", "Campaign edit not found");
        }
        const primaryCollection = await resolveCollectionWithCount(edit.collection);
        const relatedCollections = (await Promise.all(edit.related.map((s) => resolveCollectionWithCount(s)))).filter(Boolean);
        res.json({
            ...edit.toJSON(),
            collection: primaryCollection,
            relatedCollections,
        });
    }
    catch (error) {
        next(error);
    }
});
