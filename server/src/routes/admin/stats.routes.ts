import { Router, type Request, type Response, type NextFunction } from "express";
import { AffiliateClick } from "../../models/AffiliateClick.js";

export const adminStatsRouter = Router();

// GET /api/admin/stats/affiliate-clicks
adminStatsRouter.get("/affiliate-clicks", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const totalClicks = await AffiliateClick.countDocuments();

    // Group by product
    const byProduct = await AffiliateClick.aggregate([
      {
        $group: {
          _id: "$productSlug",
          retailer: { $first: "$retailer" },
          clicks: { $sum: 1 },
        },
      },
      { $project: { productSlug: "$_id", retailer: 1, clicks: 1, _id: 0 } },
      { $sort: { clicks: -1 } },
    ]);

    // Group by day (YYYY-MM-DD)
    const byDay = await AffiliateClick.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
          },
          clicks: { $sum: 1 },
        },
      },
      { $project: { date: "$_id", clicks: 1, _id: 0 } },
      { $sort: { date: -1 } },
      { $limit: 30 },
    ]);

    res.json({
      totalClicks,
      byProduct,
      byDay,
    });
  } catch (error) {
    next(error);
  }
});
