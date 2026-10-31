import crypto from "crypto";
import { Product } from "../models/Product.js";
import { Order, type IOrderDocument } from "../models/Order.js";
import { INDIAN_STATES, type CreateOrderInput } from "../schemas/order.schema.js";
import { AppError } from "../middleware/errorHandler.js";
import { notifyNewOrder } from "./notify.js";
import { getSeedProducts } from "../scripts/seedData.js";
import { env } from "../config/env.js";

export const MAX_QTY = 5;

// In-memory idempotency cache (keyed by idempotencyKey) with 24-hour TTL
interface IdempotencyRecord {
  response: Record<string, unknown>;
  createdAt: number;
}
const idempotencyStore = new Map<string, IdempotencyRecord>();

export function generateOrderRef(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const dateStr = `${year}${month}${day}`;

  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomPart = "";
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `OS-${dateStr}-${randomPart}`;
}

export function normalizeIndianMobile(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  // Take last 10 digits
  return digits.slice(-10);
}

export function hashIp(ip: string, salt: string = "offscript-salt"): string {
  return crypto.createHash("sha256").update(`${ip}:${salt}`).digest("hex");
}

export async function processOrderRequest(
  input: CreateOrderInput,
  options: {
    clientIp: string;
    userAgent: string;
    idempotencyKey?: string;
  }
) {
  // 1. Idempotency Key check
  if (options.idempotencyKey) {
    const existingRecord = idempotencyStore.get(options.idempotencyKey);
    if (existingRecord) {
      // 24 hour TTL
      if (Date.now() - existingRecord.createdAt < 24 * 60 * 60 * 1000) {
        return existingRecord.response;
      }
      idempotencyStore.delete(options.idempotencyKey);
    }
  }

  // 2. Honeypot check
  if (input._hp && input._hp.trim() !== "") {
    // Bot detected: reject
    throw new AppError(400, "INVALID_REQUEST", "Bot detected via honeypot");
  }

  // 3. Load product
  let product = await Product.findOne({ slug: input.productSlug });
  if (!product) {
    // Case-insensitive fallback
    product = await Product.findOne({
      slug: new RegExp(`^${input.productSlug.trim()}$`, "i"),
    });
  }
  if (!product) {
    // Fallback: check seed products so that default catalog pieces are never missing
    const seedProducts = getSeedProducts(env.PUBLIC_BASE_URL);
    const foundSeed = seedProducts.find(
      (p) => p.slug.toLowerCase() === input.productSlug.trim().toLowerCase()
    );
    if (foundSeed) {
      product = await Product.findOneAndUpdate(
        { slug: foundSeed.slug },
        { $setOnInsert: foundSeed },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
  }
  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Piece not found");
  }

  // 4. Strict business validation matching client order.ts
  const details: Record<string, string> = {};

  // Check COD eligibility
  const isCodEligible = product.purchaseMode === "authorized_cod" && product.codEnabled;
  if (!isCodEligible) {
    details.product = "This piece isn't available for cash on delivery.";
  }

  // Check stock
  if (!product.inStock) {
    details.product = "This piece is currently out of stock.";
  }

  // Customer validations
  if (!input.fullName || input.fullName.trim().length < 2) {
    details.fullName = "Enter your full name.";
  }

  const cleanedMobile = input.mobile.replace(/\s+/g, "");
  const isValidMobile = /^(?:\+91[\s-]?|0)?[6-9]\d{9}$/.test(cleanedMobile);
  if (!isValidMobile) {
    details.mobile = "Enter a valid 10-digit Indian mobile number.";
  }

  if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    details.email = "Enter a valid email or leave it blank.";
  }

  if (!input.house || !input.house.trim()) {
    details.house = "Enter your house or flat number.";
  }
  if (!input.street || !input.street.trim()) {
    details.street = "Enter your street or locality.";
  }
  if (!input.city || !input.city.trim()) {
    details.city = "Enter your city.";
  }

  if (
    !input.state ||
    !INDIAN_STATES.includes(input.state as (typeof INDIAN_STATES)[number])
  ) {
    details.state = "Select a valid state.";
  }

  if (!input.pin || !/^[1-9]\d{5}$/.test(input.pin.trim())) {
    details.pin = "Enter a valid 6-digit PIN code.";
  }

  // Size validation
  if (product.availableSizes.length > 0) {
    if (!input.size || !product.availableSizes.includes(input.size)) {
      details.size = "Select a size.";
    }
  }

  // Color validation
  if (product.availableColors.length > 0) {
    if (!input.color || !product.availableColors.includes(input.color)) {
      details.color = "Select a colour.";
    }
  }

  // Quantity validation
  if (
    !Number.isInteger(input.quantity) ||
    input.quantity < 1 ||
    input.quantity > MAX_QTY
  ) {
    details.quantity = `Quantity must be between 1 and ${MAX_QTY}.`;
  }

  if (!input.confirmed) {
    details.confirmed = "Please confirm your details.";
  }

  if (Object.keys(details).length > 0) {
    throw new AppError(422, "VALIDATION_ERROR", "Validation failed", details);
  }

  const normalizedMobile = normalizeIndianMobile(input.mobile);

  // 5. Duplicate abuse protection: same mobile + product + size within 10 minutes
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const existingOrder = await Order.findOne({
    "customer.mobile": normalizedMobile,
    "product.slug": product.slug,
    ...(input.size ? { size: input.size } : {}),
    createdAt: { $gte: tenMinutesAgo },
  });

  if (existingOrder) {
    throw new AppError(
      429,
      "DUPLICATE_ORDER",
      "You recently requested this piece. Please wait 10 minutes before placing another request."
    );
  }

  // 6. Recompute totals on the server
  const quantity = input.quantity;
  const itemTotal = product.price * quantity;
  const shipping = product.shippingCharge;
  const grandTotal = itemTotal + shipping;

  // 7. Snapshot product details
  const ref = generateOrderRef();
  const ipHash = hashIp(options.clientIp);

  const orderDoc: IOrderDocument = new Order({
    ref,
    product: {
      productId: String(product.id || (product as any)._id || product.slug),
      slug: product.slug,
      name: product.name,
      image: (product.images && product.images[0]) || "",
      unitPrice: product.price,
      shippingCharge: product.shippingCharge ?? 0,
    },
    customer: {
      fullName: input.fullName.trim(),
      mobile: normalizedMobile,
      email: input.email?.trim() || undefined,
      address: {
        house: input.house.trim(),
        street: input.street.trim(),
        landmark: input.landmark?.trim() || undefined,
        city: input.city.trim(),
        state: input.state.trim(),
        pin: input.pin.trim(),
      },
    },
    size: input.size || undefined,
    color: input.color.trim(),
    quantity,
    instructions: input.instructions?.trim() || undefined,
    itemTotal,
    shipping,
    grandTotal,
    status: "pending",
    statusHistory: [
      {
        status: "pending",
        timestamp: new Date(),
        note: "COD order request received",
      },
    ],
    attribution: input.attribution,
    paymentMode: "COD",
    confirmedDetails: true,
    ipHash,
    userAgent: options.userAgent,
  });

  await orderDoc.save();

  // 8. Trigger async email notification if configured
  notifyNewOrder(orderDoc).catch((err) =>
    console.error("Async notification error:", err)
  );

  // 9. Prepare response shape matching client expectations
  const responseData = {
    ref: orderDoc.ref,
    status: "pending" as const,
    product: {
      name: orderDoc.product.name,
      image: orderDoc.product.image,
    },
    size: orderDoc.size,
    color: orderDoc.color,
    quantity: orderDoc.quantity,
    itemTotal: orderDoc.itemTotal,
    shipping: orderDoc.shipping,
    grandTotal: orderDoc.grandTotal,
  };

  // Cache in idempotency store if key was provided
  if (options.idempotencyKey) {
    idempotencyStore.set(options.idempotencyKey, {
      response: responseData,
      createdAt: Date.now(),
    });
  }

  return responseData;
}
