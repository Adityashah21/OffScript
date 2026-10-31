import { Router } from "express";
import { searchAll } from "../services/search.js";
export const searchRouter = Router();
// GET /api/search?q=
searchRouter.get("/", async (req, res, next) => {
    try {
        const q = typeof req.query.q === "string" ? req.query.q : "";
        const results = await searchAll(q);
        res.json(results);
    }
    catch (error) {
        next(error);
    }
});
