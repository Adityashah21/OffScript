import { Router, type Request, type Response, type NextFunction } from "express";
import { AffiliateClick } from "../../models/AffiliateClick.js";
import { Product } from "../../models/Product.js";
import { Order } from "../../models/Order.js";
import { CustomerUser } from "../../models/CustomerUser.js";

export const adminStatsRouter = Router();

// GET /api/admin/stats/overview - Real database-backed aggregated metrics
adminStatsRouter.get("/overview", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      totalProducts,
      affiliateProducts,
      directProducts,
      outOfStockProducts,
      lowStockProducts,
      registeredCustomers,
      totalOrders,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
      totalAffiliateClicks,
      orderFinancials,
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ purchaseMode: "affiliate" }),
      Product.countDocuments({ purchaseMode: "authorized_cod" }),
      Product.countDocuments({ inStock: false }),
      Product.countDocuments({
        purchaseMode: "authorized_cod",
        stockQuantity: { $gt: 0, $lte: 5 },
      }),
      CustomerUser.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ status: "pending" }),
      Order.countDocuments({ status: "delivered" }),
      Order.countDocuments({ status: "cancelled" }),
      AffiliateClick.countDocuments(),
      Order.aggregate([
        {
          $match: {
            status: { $nin: ["cancelled", "rto", "failed_delivery"] },
          },
        },
        {
          $group: {
            _id: null,
            grossOrderValue: { $sum: "$grandTotal" },
            averageOrderValue: { $avg: "$grandTotal" },
            totalUnitsSold: { $sum: "$quantity" },
          },
        },
      ]),
    ]);

    const financials = orderFinancials[0] || {
      grossOrderValue: 0,
      averageOrderValue: 0,
      totalUnitsSold: 0,
    };

    res.json({
      catalog: {
        totalProducts,
        affiliateProducts,
        directProducts,
        outOfStockProducts,
        lowStockProducts,
      },
      customers: {
        registeredCustomers,
      },
      orders: {
        totalOrders,
        pendingOrders,
        deliveredOrders,
        cancelledOrders,
        grossOrderValue: Math.round(financials.grossOrderValue || 0),
        averageOrderValue: Math.round(financials.averageOrderValue || 0),
        totalUnitsSold: financials.totalUnitsSold || 0,
      },
      affiliates: {
        totalClicks: totalAffiliateClicks,
      },
    });
  } catch (error) {
    next(error);
  }
});

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
