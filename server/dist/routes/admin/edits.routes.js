import { Router } from "express";
import { Edit } from "../../models/Edit.js";
import { editSchema } from "../../schemas/edit.schema.js";
import { AppError } from "../../middleware/errorHandler.js";
export const adminEditsRouter = Router();
// GET /api/admin/edits
adminEditsRouter.get("/", async (_req, res, next) => {
    try {
        const edits = await Edit.find().sort({ createdAt: -1 });
        res.json(edits.map((e) => e.toJSON()));
    }
    catch (error) {
        next(error);
    }
});
// POST /api/admin/edits
adminEditsRouter.post("/", async (req, res, next) => {
    try {
        const data = editSchema.parse(req.body);
        const existing = await Edit.findOne({ slug: data.slug });
        if (existing) {
            throw new AppError(409, "SLUG_EXISTS", "Campaign edit slug already exists");
        }
        const edit = new Edit(data);
        await edit.save();
        res.status(201).json(edit.toJSON());
    }
    catch (error) {
        next(error);
    }
});
// GET /api/admin/edits/:slug
adminEditsRouter.get("/:slug", async (req, res, next) => {
    try {
        const edit = await Edit.findOne({ slug: req.params.slug });
        if (!edit) {
            throw new AppError(404, "EDIT_NOT_FOUND", "Campaign edit not found");
        }
        res.json(edit.toJSON());
    }
    catch (error) {
        next(error);
    }
});
// PUT /api/admin/edits/:slug
adminEditsRouter.put("/:slug", async (req, res, next) => {
    try {
        const data = editSchema.parse(req.body);
        const edit = await Edit.findOne({ slug: req.params.slug });
        if (!edit) {
            throw new AppError(404, "EDIT_NOT_FOUND", "Campaign edit not found");
        }
        if (data.slug !== req.params.slug) {
            const collision = await Edit.findOne({ slug: data.slug });
            if (collision) {
                throw new AppError(409, "SLUG_EXISTS", "New slug already exists");
            }
        }
        Object.assign(edit, data);
        await edit.save();
        res.json(edit.toJSON());
    }
    catch (error) {
        next(error);
    }
});
// DELETE /api/admin/edits/:slug
adminEditsRouter.delete("/:slug", async (req, res, next) => {
    try {
        const edit = await Edit.findOneAndDelete({ slug: req.params.slug });
        if (!edit) {
            throw new AppError(404, "EDIT_NOT_FOUND", "Campaign edit not found");
        }
        res.json({ success: true, deletedSlug: req.params.slug });
    }
    catch (error) {
        next(error);
    }
});
