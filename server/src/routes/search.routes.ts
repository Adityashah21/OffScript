import { Router, type Request, type Response, type NextFunction } from "express";
import { searchAll } from "../services/search.js";

export const searchRouter = Router();

// GET /api/search?q=
searchRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q : "";
    const results = await searchAll(q);
    res.json(results);
  } catch (error) {
    next(error);
  }
});
