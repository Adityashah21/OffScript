import express, { type Express, type Request, type Response } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./config/env.js";
import { AppError, errorHandler } from "./middleware/errorHandler.js";
import { productsRouter } from "./routes/products.routes.js";
import { collectionsRouter } from "./routes/collections.routes.js";
import { editsRouter } from "./routes/edits.routes.js";
import { searchRouter } from "./routes/search.routes.js";
import { ordersRouter } from "./routes/orders.routes.js";
import { contactRouter } from "./routes/contact.routes.js";
import { newsletterRouter } from "./routes/newsletter.routes.js";
import { affiliateRouter } from "./routes/affiliate.routes.js";
import { adminRouter } from "./routes/admin/index.js";
import { seed } from "./scripts/seed.js";
import { Product } from "./models/Product.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp(): Express {
  const app = express();

  // 1. Security Headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  // 2. CORS restriction (supports comma-separated origins, wildcards, Vercel & Render domains)
  const configuredOrigins = env.CLIENT_ORIGIN.split(",").map((s) => s.trim().replace(/\/$/, ""));

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, server-to-server)
        if (!origin) {
          return callback(null, true);
        }
        const normalizedOrigin = origin.replace(/\/$/, "");

        // Allow wildcard '*'
        if (configuredOrigins.includes("*")) {
          return callback(null, true);
        }

        // Allow exact matches from CLIENT_ORIGIN
        if (configuredOrigins.includes(normalizedOrigin)) {
          return callback(null, true);
        }

        // Allow any Vercel deployment (storefront, admin dashboard, preview branches)
        if (
          normalizedOrigin.endsWith(".vercel.app") ||
          normalizedOrigin.includes(".vercel.app")
        ) {
          return callback(null, true);
        }

        // Allow any Render deployment
        if (
          normalizedOrigin.endsWith(".onrender.com") ||
          normalizedOrigin.includes(".onrender.com")
        ) {
          return callback(null, true);
        }

        // Allow localhost for development
        if (
          normalizedOrigin.startsWith("http://localhost:") ||
          normalizedOrigin === "http://localhost" ||
          normalizedOrigin.startsWith("http://127.0.0.1:") ||
          normalizedOrigin === "http://127.0.0.1"
        ) {
          return callback(null, true);
        }

        callback(new AppError(403, "CORS_FORBIDDEN", `Origin '${origin}' not permitted`));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key"],
    })
  );

  // 3. Body Parsing with size limit
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  // 4. Data Sanitization against NoSQL query injection
  app.use(mongoSanitize());

  // 5. Safe Logging: Morgan logs method, url, status, response time - NO body, NO PII
  if (env.NODE_ENV !== "test") {
    app.use(morgan(":method :url :status :res[content-length] - :response-time ms"));
  }

  // 6. Global Rate Limiter
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests from this IP, please try again later",
      },
    },
  });
  app.use(globalLimiter);

  // 7. Static file serving for uploads (e.g. seed images)
  const uploadsPath = path.resolve(__dirname, "../uploads");
  app.use("/static", express.static(uploadsPath));

  // 8. Health check route
  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Database seed trigger (idempotent, safe for initial setup)
  app.all("/api/seed", async (_req: Request, res: Response, next) => {
    try {
      await seed();
      const count = await Product.countDocuments();
      res.status(200).json({ ok: true, message: `Seeded catalog successfully. Total pieces: ${count}` });
    } catch (error) {
      next(error);
    }
  });

  // 9. Public API Routes
  app.use("/api/products", productsRouter);
  app.use("/api/collections", collectionsRouter);
  app.use("/api/edits", editsRouter);
  app.use("/api/search", searchRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/contact", contactRouter);
  app.use("/api/newsletter", newsletterRouter);
  app.use("/api/r", affiliateRouter);

  // Admin API Routes (JWT protected)
  app.use("/api/admin", adminRouter);

  // Top-level alias for affiliate redirect /r/:slug
  app.use("/r", affiliateRouter);

  // 10. 404 for unknown routes
  app.use((req: Request, _res: Response, next) => {
    next(new AppError(404, "NOT_FOUND", `Cannot ${req.method} ${req.originalUrl}`));
  });

  // 10. Centralized Error Handler
  app.use(errorHandler);

  return app;
}
