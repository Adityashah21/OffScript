import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "./errorHandler.js";

export interface UserPayload {
  id: string;
  email: string;
  role: "admin" | "customer";
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
      customer?: UserPayload;
    }
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication token required");
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as UserPayload;
    if (decoded.role !== "admin") {
      throw new AppError(403, "FORBIDDEN", "Administrative privileges required");
    }
    req.user = decoded;
    next();
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    throw new AppError(401, "UNAUTHORIZED", "Invalid or expired authentication token");
  }
}

export function requireCustomer(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError(401, "UNAUTHORIZED", "Customer sign-in required");
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as UserPayload;
    req.user = decoded;
    req.customer = decoded;
    next();
  } catch (err: any) {
    throw new AppError(401, "UNAUTHORIZED", "Invalid or expired sign-in session");
  }
}

export function optionalCustomer(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as UserPayload;
      req.user = decoded;
      req.customer = decoded;
    } catch {
      // Ignore invalid token on optional auth
    }
  }
  next();
}
