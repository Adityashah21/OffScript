import { Router, type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";
import crypto from "crypto";
import { CustomerUser, type ICustomerUserDocument } from "../models/CustomerUser.js";
import { Order } from "../models/Order.js";
import { requireCustomer } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import { env } from "../config/env.js";
import { authRateLimiter } from "../middleware/rateLimiters.js";

export const customerRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(60),
  email: z.string().email("Valid email required").toLowerCase().trim(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  mobile: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Valid email required").toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
});

const addressSchema = z.object({
  id: z.string().optional(),
  tag: z.string().default("Home"),
  fullName: z.string().min(2, "Full name required"),
  mobile: z.string().min(10, "Valid 10-digit mobile required"),
  house: z.string().min(1, "House / Flat number required"),
  street: z.string().min(1, "Street / Locality required"),
  landmark: z.string().optional(),
  city: z.string().min(1, "City required"),
  state: z.string().min(1, "State required"),
  pin: z.string().regex(/^[1-9]\d{5}$/, "Valid 6-digit PIN required"),
  isDefault: z.boolean().optional(),
});

function createCustomerToken(customer: ICustomerUserDocument): string {
  return jwt.sign(
    {
      id: customer.id,
      email: customer.email,
      role: "customer",
    },
    env.JWT_SECRET,
    { expiresIn: "30d" }
  );
}

// 1. POST /api/customer/register
customerRouter.post(
  "/register",
  authRateLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password, mobile } = registerSchema.parse(req.body);

      const existing = await CustomerUser.findOne({ email });
      if (existing) {
        throw new AppError(409, "EMAIL_EXISTS", "An account with this email already exists");
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const customer = new CustomerUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        mobile: mobile ? mobile.trim() : undefined,
        role: "customer",
      });

      await customer.save();
      const token = createCustomerToken(customer);

      res.status(201).json({
        token,
        customer: customer.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  }
);

// 2. POST /api/customer/login
customerRouter.post(
  "/login",
  authRateLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const customer = await CustomerUser.findOne({ email }).select("+passwordHash");
      if (!customer) {
        throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
      }

      const isMatch = await customer.comparePassword(password);
      if (!isMatch) {
        throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
      }

      const token = createCustomerToken(customer);

      res.status(200).json({
        token,
        customer: customer.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  }
);

// 3. GET /api/customer/me
customerRouter.get(
  "/me",
  requireCustomer,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customer = await CustomerUser.findById(req.customer?.id);
      if (!customer) {
        throw new AppError(404, "CUSTOMER_NOT_FOUND", "Account not found");
      }
      res.json({ customer: customer.toJSON() });
    } catch (error) {
      next(error);
    }
  }
);

// 4. PUT /api/customer/profile
customerRouter.put(
  "/profile",
  requireCustomer,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, mobile } = req.body || {};
      const customer = await CustomerUser.findById(req.customer?.id);
      if (!customer) {
        throw new AppError(404, "CUSTOMER_NOT_FOUND", "Account not found");
      }

      if (name && typeof name === "string") customer.name = name.trim();
      if (mobile && typeof mobile === "string") customer.mobile = mobile.trim();

      await customer.save();
      res.json({ customer: customer.toJSON() });
    } catch (error) {
      next(error);
    }
  }
);

// 5. POST /api/customer/addresses - Add or update address
customerRouter.post(
  "/addresses",
  requireCustomer,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const addressData = addressSchema.parse(req.body);
      const customer = await CustomerUser.findById(req.customer?.id);
      if (!customer) {
        throw new AppError(404, "CUSTOMER_NOT_FOUND", "Account not found");
      }

      const addressId = addressData.id || crypto.randomUUID();
      const newAddress = {
        id: addressId,
        tag: addressData.tag || "Home",
        fullName: addressData.fullName.trim(),
        mobile: addressData.mobile.trim(),
        house: addressData.house.trim(),
        street: addressData.street.trim(),
        landmark: addressData.landmark?.trim(),
        city: addressData.city.trim(),
        state: addressData.state.trim(),
        pin: addressData.pin.trim(),
        isDefault: Boolean(addressData.isDefault),
      };

      if (newAddress.isDefault) {
        customer.addresses.forEach((addr) => (addr.isDefault = false));
      }

      const existingIndex = customer.addresses.findIndex((a) => a.id === addressId);
      if (existingIndex >= 0) {
        customer.addresses[existingIndex] = newAddress;
      } else {
        if (customer.addresses.length === 0) {
          newAddress.isDefault = true;
        }
        customer.addresses.push(newAddress);
      }

      await customer.save();
      res.json({ addresses: customer.addresses });
    } catch (error) {
      next(error);
    }
  }
);

// 6. DELETE /api/customer/addresses/:id
customerRouter.delete(
  "/addresses/:id",
  requireCustomer,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customer = await CustomerUser.findById(req.customer?.id);
      if (!customer) {
        throw new AppError(404, "CUSTOMER_NOT_FOUND", "Account not found");
      }

      customer.addresses = customer.addresses.filter((a) => a.id !== req.params.id);
      await customer.save();
      res.json({ addresses: customer.addresses });
    } catch (error) {
      next(error);
    }
  }
);

// 7. POST /api/customer/wishlist - Toggle wishlist slug
customerRouter.post(
  "/wishlist",
  requireCustomer,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.body || {};
      if (!slug || typeof slug !== "string") {
        throw new AppError(400, "INVALID_SLUG", "Product slug is required");
      }

      const customer = await CustomerUser.findById(req.customer?.id);
      if (!customer) {
        throw new AppError(404, "CUSTOMER_NOT_FOUND", "Account not found");
      }

      const cleanSlug = slug.trim().toLowerCase();
      const has = customer.wishlist.includes(cleanSlug);
      if (has) {
        customer.wishlist = customer.wishlist.filter((s) => s !== cleanSlug);
      } else {
        customer.wishlist.push(cleanSlug);
      }

      await customer.save();
      res.json({ wishlist: customer.wishlist, inWishlist: !has });
    } catch (error) {
      next(error);
    }
  }
);

// 8. POST /api/customer/recently-viewed
customerRouter.post(
  "/recently-viewed",
  requireCustomer,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.body || {};
      if (!slug || typeof slug !== "string") {
        res.status(200).json({ ok: true });
        return;
      }

      const cleanSlug = slug.trim().toLowerCase();
      await CustomerUser.updateOne(
        { _id: req.customer?.id },
        {
          $pull: { recentlyViewed: cleanSlug },
        }
      );
      await CustomerUser.updateOne(
        { _id: req.customer?.id },
        {
          $push: {
            recentlyViewed: {
              $each: [cleanSlug],
              $position: 0,
              $slice: 20,
            },
          },
        }
      );

      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  }
);

// 9. GET /api/customer/orders - Orders strictly restricted to authenticated customer
customerRouter.get(
  "/orders",
  requireCustomer,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customer = await CustomerUser.findById(req.customer?.id);
      if (!customer) {
        throw new AppError(404, "CUSTOMER_NOT_FOUND", "Account not found");
      }

      const query: Record<string, any> = {
        $or: [
          { customerId: customer.id },
          { "customer.email": customer.email.toLowerCase() },
          ...(customer.mobile ? [{ "customer.mobile": customer.mobile }] : []),
        ],
      };

      const orders = await Order.find(query).sort({ createdAt: -1 }).limit(50);

      const formatted = orders.map((o) => ({
        ref: o.ref,
        status: o.status,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
        product: o.product,
        size: o.size,
        color: o.color,
        quantity: o.quantity,
        itemTotal: o.itemTotal,
        shipping: o.shipping,
        grandTotal: o.grandTotal,
        paymentMode: o.paymentMode,
        statusHistory: o.statusHistory,
        customer: {
          fullName: o.customer.fullName,
          mobile: o.customer.mobile,
          email: o.customer.email,
          address: o.customer.address,
        },
      }));

      res.json({ orders: formatted });
    } catch (error) {
      next(error);
    }
  }
);
