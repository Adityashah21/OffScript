import { Router } from "express";
import { adminAuthRouter } from "./auth.routes.js";
import { adminProductsRouter } from "./products.routes.js";
import { adminCollectionsRouter } from "./collections.routes.js";
import { adminEditsRouter } from "./edits.routes.js";
import { adminOrdersRouter } from "./orders.routes.js";
import { adminCrmRouter } from "./crm.routes.js";
import { adminStatsRouter } from "./stats.routes.js";
import { adminUploadsRouter } from "./uploads.routes.js";
import { requireAdmin } from "../../middleware/auth.js";

export const adminRouter = Router();

// Auth routes (unprotected login)
adminRouter.use("/auth", adminAuthRouter);
adminRouter.use("/login", adminAuthRouter);

// Protected admin routes (require valid JWT Bearer token)
adminRouter.use("/products", requireAdmin, adminProductsRouter);
adminRouter.use("/collections", requireAdmin, adminCollectionsRouter);
adminRouter.use("/edits", requireAdmin, adminEditsRouter);
adminRouter.use("/orders", requireAdmin, adminOrdersRouter);
adminRouter.use("/crm", requireAdmin, adminCrmRouter);
adminRouter.use("/stats", requireAdmin, adminStatsRouter);
adminRouter.use("/uploads", requireAdmin, adminUploadsRouter);
