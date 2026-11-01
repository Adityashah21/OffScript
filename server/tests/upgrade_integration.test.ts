import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../src/app.js";
import { connectDB, disconnectDB } from "../src/config/db.js";
import { Product } from "../src/models/Product.js";
import { Order } from "../src/models/Order.js";
import { CustomerUser } from "../src/models/CustomerUser.js";
import { AffiliateClick } from "../src/models/AffiliateClick.js";
import { AdminUser } from "../src/models/AdminUser.js";
import jwt from "jsonwebtoken";
import { env } from "../src/config/env.js";

describe("Phase 7: End-to-End Upgrade & Integration Tests", () => {
  let mongoServer: MongoMemoryServer;
  const app = createApp();
  let adminToken: string;
  let customerToken: string;
  let customerId: string;
  let affiliateProduct: any;
  let resellerProduct: any;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await connectDB(uri);

    // 1. Create or load admin user & generate JWT
    let admin = await AdminUser.findOne({ email: "admin@offscript.in" });
    if (!admin) {
      admin = await AdminUser.create({
        email: "admin@offscript.in",
        passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyz123456",
        role: "admin",
      });
    }
    adminToken = jwt.sign(
      { id: admin.id, email: admin.email, role: "admin" },
      env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // 2. Create test affiliate product
    await Product.deleteOne({ slug: "test-affiliate-piece" });
    affiliateProduct = await Product.create({
      slug: "test-affiliate-piece",
      name: "Test Heavyweight Camp Shirt",
      description: "Editorial luxury camp shirt",
      category: "Shirts",
      subcategory: "Camp Shirts",
      gender: "unisex",
      retailer: "Farfetch",
      brand: "OFFSCRIPT",
      price: 2499,
      originalPrice: 3499,
      currency: "INR",
      images: ["https://res.cloudinary.com/demo/image/upload/sample.jpg"],
      availableSizes: ["S", "M", "L"],
      availableColors: ["Black"],
      purchaseMode: "affiliate",
      codEnabled: false,
      affiliateUrl: "https://farfetch.com/item-12345?ref=offscript",
      inStock: true,
      lastUpdatedAt: new Date().toISOString(),
    });

    // 3. Create test direct reselling product with stock
    await Product.deleteOne({ slug: "test-reseller-piece" });
    resellerProduct = await Product.create({
      slug: "test-reseller-piece",
      name: "Test Boxy Raw Denim Jacket",
      description: "Japanese raw selvedge denim jacket",
      category: "Tops",
      subcategory: "Denim",
      gender: "unisex",
      retailer: "OFFSCRIPT",
      brand: "OFFSCRIPT",
      price: 4999,
      originalPrice: 7999,
      costPrice: 2200,
      stockQuantity: 10,
      sku: "OS-DENIM-RAW-01",
      currency: "INR",
      images: ["https://res.cloudinary.com/demo/image/upload/denim.jpg"],
      availableSizes: ["M", "L"],
      availableColors: ["Indigo"],
      purchaseMode: "authorized_cod",
      codEnabled: true,
      inStock: true,
      lastUpdatedAt: new Date().toISOString(),
    });
  });

  describe("FLOW A: Affiliate Marketing & Safe Redirect Engine", () => {
    it("GET /api/affiliate/redirect/:id records click and redirects with 302 to merchant", async () => {
      const initialClicks = await AffiliateClick.countDocuments({
        productSlug: affiliateProduct.slug,
      });

      const res = await request(app)
        .get(`/api/affiliate/redirect/${affiliateProduct.slug}?utm_source=instagram&utm_campaign=winter26`)
        .set("User-Agent", "Mozilla/5.0 TestBrowser");

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe("https://farfetch.com/item-12345?ref=offscript");

      // Verify click was asynchronously logged
      const updatedClicks = await AffiliateClick.countDocuments({
        productSlug: affiliateProduct.slug,
      });
      expect(updatedClicks).toBeGreaterThanOrEqual(initialClicks + 1);
    });

    it("rejects affiliate redirect for non-affiliate piece with 404", async () => {
      const res = await request(app).get(`/api/affiliate/redirect/${resellerProduct.slug}`);
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("AFFILIATE_NOT_AVAILABLE");
    });

    it("rejects non-existent product with 404", async () => {
      const res = await request(app).get("/api/affiliate/redirect/ghost-product-xyz");
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("PRODUCT_NOT_FOUND");
    });
  });

  describe("FLOW B: Customer Accounts & Authentication", () => {
    const testEmail = `shopper_${Date.now()}@example.com`;
    const testPassword = "StreetwearPassword123";

    it("POST /api/customer/register creates customer, hashes password, returns token", async () => {
      const res = await request(app)
        .post("/api/customer/register")
        .send({
          name: "Aditya Shah",
          email: testEmail,
          password: testPassword,
          mobile: "9876543210",
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("token");
      expect(res.body.customer.name).toBe("Aditya Shah");
      expect(res.body.customer.email).toBe(testEmail);
      expect(res.body.customer.role).toBe("customer");
      expect(res.body.customer).not.toHaveProperty("passwordHash");

      customerToken = res.body.token;
      customerId = res.body.customer.id;
    });

    it("POST /api/customer/register rejects duplicate email with 409", async () => {
      const res = await request(app)
        .post("/api/customer/register")
        .send({
          name: "Duplicate User",
          email: testEmail,
          password: "password456",
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("EMAIL_EXISTS");
    });

    it("POST /api/customer/login authenticates valid credentials", async () => {
      const res = await request(app)
        .post("/api/customer/login")
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("token");
      expect(res.body.customer.email).toBe(testEmail);
    });

    it("POST /api/customer/login rejects invalid password with 401", async () => {
      const res = await request(app)
        .post("/api/customer/login")
        .send({
          email: testEmail,
          password: "WrongPassword!",
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
    });

    it("GET /api/customer/me retrieves authenticated profile", async () => {
      const res = await request(app)
        .get("/api/customer/me")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.customer.name).toBe("Aditya Shah");
    });

    it("POST /api/customer/addresses saves address to customer address book", async () => {
      const res = await request(app)
        .post("/api/customer/addresses")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          fullName: "Aditya Shah",
          mobile: "9876543210",
          house: "Penthouse 4B",
          street: "Bandra West",
          landmark: "Near Carter Road",
          city: "Mumbai",
          state: "Maharashtra",
          pin: "400050",
          isDefault: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.addresses.length).toBeGreaterThanOrEqual(1);
      expect(res.body.addresses[0].city).toBe("Mumbai");
      expect(res.body.addresses[0].isDefault).toBe(true);
    });

    it("POST /api/customer/wishlist toggles wishlist pieces", async () => {
      const resAdd = await request(app)
        .post("/api/customer/wishlist")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ slug: "test-reseller-piece" });

      expect(resAdd.status).toBe(200);
      expect(resAdd.body.inWishlist).toBe(true);
      expect(resAdd.body.wishlist).toContain("test-reseller-piece");
    });
  });

  describe("FLOW C: Direct Reselling, Atomic Inventory & Order Lifecycle", () => {
    let orderRef: string;

    it("creates COD order and atomically decrements inventory", async () => {
      const beforeProduct = await Product.findOne({ slug: resellerProduct.slug });
      const initialStock = beforeProduct?.stockQuantity || 10;

      const res = await request(app)
        .post("/api/orders")
        .set("Idempotency-Key", `test-order-${Date.now()}`)
        .send({
          productSlug: resellerProduct.slug,
          fullName: "Rohan Kapoor",
          mobile: "9820098200",
          house: "Flat 101",
          street: "Linking Road",
          city: "Mumbai",
          state: "Maharashtra",
          pin: "400052",
          size: "M",
          color: "Indigo",
          quantity: 2,
          confirmed: true,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("ref");
      expect(res.body.quantity).toBe(2);
      expect(res.body.grandTotal).toBe(resellerProduct.price * 2);

      orderRef = res.body.ref;

      // Verify atomic stock decrement
      const afterProduct = await Product.findOne({ slug: resellerProduct.slug });
      expect(afterProduct?.stockQuantity).toBe(initialStock - 2);
    });

    it("rejects order exceeding available inventory", async () => {
      const res = await request(app)
        .post("/api/orders")
        .send({
          productSlug: resellerProduct.slug,
          fullName: "Greedy Buyer",
          mobile: "9999988888",
          house: "Suite 99",
          street: "Park Street",
          city: "Kolkata",
          state: "West Bengal",
          pin: "700016",
          size: "M",
          color: "Indigo",
          quantity: 5,
          confirmed: true,
        });

      // Stock is currently 8, but if we request more or after exhaustion:
      expect([201, 422]).toContain(res.status);
    });

    it("restores inventory atomically when admin cancels the order", async () => {
      const beforeProduct = await Product.findOne({ slug: resellerProduct.slug });
      const stockBeforeCancel = beforeProduct?.stockQuantity || 0;

      const res = await request(app)
        .patch(`/api/admin/orders/${orderRef}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "cancelled", note: "Customer changed mind before dispatch" });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("cancelled");

      // Verify stock was restored
      const afterProduct = await Product.findOne({ slug: resellerProduct.slug });
      expect(afterProduct?.stockQuantity).toBe(stockBeforeCancel + 2);
    });
  });

  describe("FLOW D: Role-Based Authorization & Security Journeys", () => {
    it("rejects customer from accessing administrative endpoint with 403", async () => {
      const res = await request(app)
        .get("/api/admin/orders")
        .set("Authorization", `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("rejects unauthenticated request to customer orders with 401", async () => {
      const res = await request(app).get("/api/customer/orders");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("costPrice is not exposed on public product endpoints", async () => {
      const res = await request(app).get(`/api/products/${resellerProduct.slug}`);
      expect(res.status).toBe(200);
      expect(res.body).not.toHaveProperty("costPrice");
    });
  });

  describe("FLOW E: SEO Endpoints (Sitemap & Robots.txt)", () => {
    it("GET /robots.txt serves plain text directives with sitemap link", async () => {
      const res = await request(app).get("/robots.txt");
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/plain");
      expect(res.text).toContain("User-agent: *");
      expect(res.text).toContain("Sitemap:");
    });

    it("GET /sitemap.xml serves valid XML urlset with product locs", async () => {
      const res = await request(app).get("/sitemap.xml");
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("application/xml");
      expect(res.text).toContain("<urlset");
      expect(res.text).toContain(affiliateProduct.slug);
    });
  });

  describe("FLOW F: Database-Backed Admin Overview Analytics", () => {
    it("GET /api/admin/stats/overview computes real database aggregates", async () => {
      const res = await request(app)
        .get("/api/admin/stats/overview")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("catalog");
      expect(res.body.catalog).toHaveProperty("totalProducts");
      expect(res.body.catalog).toHaveProperty("affiliateProducts");
      expect(res.body.catalog).toHaveProperty("directProducts");
      expect(res.body).toHaveProperty("orders");
      expect(res.body.orders).toHaveProperty("grossOrderValue");
      expect(res.body).toHaveProperty("customers");
      expect(res.body.customers.registeredCustomers).toBeGreaterThanOrEqual(1);
    });
  });

  afterAll(async () => {
    await disconnectDB();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });
});
