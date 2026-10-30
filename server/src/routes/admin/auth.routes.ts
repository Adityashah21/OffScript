import { Router, type Request, type Response, type NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { AdminUser } from "../../models/AdminUser.js";
import { adminLoginSchema } from "../../schemas/common.schema.js";
import { loginRateLimiter } from "../../middleware/rateLimiters.js";
import { requireAdmin } from "../../middleware/auth.js";
import { AppError } from "../../middleware/errorHandler.js";

export const adminAuthRouter = Router();

// POST /api/admin/auth/login or /api/admin/login
adminAuthRouter.post(
  ["/login", "/"],
  loginRateLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = adminLoginSchema.parse(req.body);

      const admin = await AdminUser.findOne({ email: email.toLowerCase().trim() });
      if (!admin) {
        throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
      }

      const isValid = await bcrypt.compare(password, admin.passwordHash);
      if (!isValid) {
        throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
      }

      const token = jwt.sign(
        { id: admin.id, email: admin.email, role: admin.role },
        env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.status(200).json({
        token,
        user: {
          email: admin.email,
          role: admin.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/admin/auth/me
adminAuthRouter.get(
  "/me",
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({ user: req.user });
    } catch (error) {
      next(error);
    }
  }
);
