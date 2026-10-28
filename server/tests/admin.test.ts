import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../src/app.js";
import { connectDB, disconnectDB } from "../src/config/db.js";
import { seed } from "../src/scripts/seed.js";
import { env } from "../src/config/env.js";
import { Order } from "../src/models/Order.js";
import { ContactMessage } from "../src/models/ContactMessage.js";
import { AffiliateClick } from "../src/models/AffiliateClick.js";

describe("Phase 5: Admin Auth, CRUD & Operations Tests", () => {
  let mongoServer: MongoMemoryServer;
  const app = createApp();
  let adminToken = "";

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await connectDB(uri);
    await seed("http://localhost:5000");

    // Login to get adminToken
    const res = await request(app).post("/api/admin/auth/login").send({
      email: env.ADMIN_EMAIL,
      password: env.ADMIN_PASSWORD,
    });
    adminToken = res.body.token;
  });

  afterAll(async () => {
    await disconnectDB();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  describe("Admin Authentication", () => {
    it("rejects unauthorized access to protected admin routes with 401", async () => {
      const res1 = await request(app).get("/api/admin/products");
      expect(res1.status).toBe(401);

      const res2 = await request(app)
        .get("/api/admin/orders")
        .set("Authorization", "Bearer invalid-token");
      expect(res2.status).toBe(401);
    });

    it("rejects login with incorrect password with 401", async () => {
      const res = await request(app).post("/api/admin/auth/login").send({
        email: env.ADMIN_EMAIL,
        password: "wrongpassword123",
      });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
    });

    it("GET /api/admin/auth/me returns current admin user info", async () => {
      const res = await request(app)
        .get("/api/admin/auth/me")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(env.ADMIN_EMAIL.toLowerCase());
      expect(res.body.user.role).toBe("admin");
    });
  });

  describe("Admin Products CRUD", () => {
    const newProduct = {
      slug: "admin-oversized-hoodie",
      name: "Admin Oversized Hoodie",
      description: "Heavyweight fleece hoodie for testing admin creation.",
      category: "Tops",
      subcategory: "Hoodies",
      gender: "unisex",
      retailer: "OFFSCRIPT Studio",
      brand: "Northlane",
      price: 1999,
      originalPrice: 2499,
      currency: "INR",
      images: ["http://localhost:5000/static/seed/p-tee.jpg"],
      availableSizes: ["S", "M", "L", "XL"],
      availableColors: ["Charcoal"],
      tags: ["hoodie", "fleece", "oversized"],
      collectionIds: ["streetwear"],
      purchaseMode: "authorized_cod",
      codEnabled: true,
      shippingCharge: 49,
      inStock: true,
      isFeatured: true,
      isNew: true,
      isEditorsPick: false,
      lastUpdatedAt: new Date().toISOString(),
    };

    it("POST /api/admin/products creates a new product enforcing invariants", async () => {
      const res = await request(app)
        .post("/api/admin/products")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newProduct);

      expect(res.status).toBe(201);
      expect(res.body.slug).toBe(newProduct.slug);
      expect(res.body.id).toBeDefined();
    });

    it("PATCH /api/admin/products/:slug/price updates price and auto-updates lastUpdatedAt", async () => {
      const original = (
        await request(app)
          .get(`/api/admin/products/${newProduct.slug}`)
          .set("Authorization", `Bearer ${adminToken}`)
      ).body;

      const res = await request(app)
        .patch(`/api/admin/products/${newProduct.slug}/price`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ price: 2199, originalPrice: 2699 });

      expect(res.status).toBe(200);
      expect(res.body.price).toBe(2199);
      expect(res.body.originalPrice).toBe(2699);
      expect(res.body.lastUpdatedAt).not.toBe(original.lastUpdatedAt);
    });

    it("PATCH /api/admin/products/bulk-stock toggles stock for multiple products", async () => {
      const res = await request(app)
        .patch("/api/admin/products/bulk-stock")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          slugs: [newProduct.slug, "washed-black-oversized-tee"],
          inStock: false,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.modifiedCount).toBe(2);

      // Revert back
      await request(app)
        .patch("/api/admin/products/bulk-stock")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          slugs: [newProduct.slug, "washed-black-oversized-tee"],
          inStock: true,
        });
    });

    it("DELETE /api/admin/products/:slug deletes a product", async () => {
      const res = await request(app)
        .delete(`/api/admin/products/${newProduct.slug}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const check = await request(app)
        .get(`/api/admin/products/${newProduct.slug}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(check.status).toBe(404);
    });
  });

  describe("Admin Collections & Edits CRUD", () => {
    it("POST /api/admin/collections creates and PUT updates a collection", async () => {
      const newCol = {
        slug: "admin-monsoon-fits",
        title: "Monsoon Fits",
        eyebrow: "Season edit",
        description: "Water-repellent jackets and quick-dry bottoms.",
        image: "http://localhost:5000/static/seed/cat-streetwear.jpg",
        match: { any: [{ field: "category", op: "eq", value: "Bottoms" }] },
        placements: [{ surface: "trend", order: 10 }],
      };

      const createRes = await request(app)
        .post("/api/admin/collections")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newCol);

      expect(createRes.status).toBe(201);
      expect(createRes.body.slug).toBe(newCol.slug);

      const updateRes = await request(app)
        .put(`/api/admin/collections/${newCol.slug}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ ...newCol, title: "Monsoon Fits 2026" });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.title).toBe("Monsoon Fits 2026");

      // Cleanup
      await request(app)
        .delete(`/api/admin/collections/${newCol.slug}`)
        .set("Authorization", `Bearer ${adminToken}`);
    });

    it("POST /api/admin/edits creates and DELETE deletes an edit", async () => {
      const newEdit = {
        slug: "admin-summer-preview",
        headline: ["Summer preview", "for warmer", "days ahead."],
        intro: "Light linen and breezy tees.",
        image: "http://localhost:5000/static/seed/cat-everyday.jpg",
        collection: "clean-fit",
        related: ["streetwear", "under-999"],
      };

      const createRes = await request(app)
        .post("/api/admin/edits")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newEdit);

      expect(createRes.status).toBe(201);
      expect(createRes.body.slug).toBe(newEdit.slug);

      const delRes = await request(app)
        .delete(`/api/admin/edits/${newEdit.slug}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);
    });
  });

  describe("Admin Orders Management", () => {
    let testOrderRef = "";

    beforeAll(async () => {
      // Seed a test order
      const order = await Order.create({
        ref: "OS-20261028-TEST01",
        product: {
          productId: "p01",
          slug: "washed-black-oversized-tee",
          name: "Washed Black Oversized Tee",
          image: "http://localhost:5000/static/seed/p-tee.jpg",
          unitPrice: 699,
          shippingCharge: 49,
        },
        customer: {
          fullName: "Admin Test Customer",
          mobile: "9876543210",
          email: "customer@test.com",
          address: {
            house: "101",
            street: "MG Road",
            city: "Bengaluru",
            state: "Karnataka",
            pin: "560001",
          },
        },
        size: "M",
        color: "Washed Black",
        quantity: 1,
        itemTotal: 699,
        shipping: 49,
        grandTotal: 748,
        status: "pending",
        statusHistory: [{ status: "pending", timestamp: new Date(), note: "Order placed" }],
        paymentMode: "COD",
        confirmedDetails: true,
        ipHash: "hash123",
        userAgent: "test-agent",
      });
      testOrderRef = order.ref;
    });

    it("GET /api/admin/orders lists orders and filters by status and search", async () => {
      const res = await request(app)
        .get("/api/admin/orders?status=pending&search=Admin%20Test")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.items.length).toBeGreaterThanOrEqual(1);
      expect(res.body.items[0].ref).toBe(testOrderRef);
    });

    it("GET /api/admin/orders/:ref retrieves single order details", async () => {
      const res = await request(app)
        .get(`/api/admin/orders/${testOrderRef}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ref).toBe(testOrderRef);
      expect(res.body.customer.fullName).toBe("Admin Test Customer");
    });

    it("PATCH /api/admin/orders/:ref/status updates status and rejects invalid transitions", async () => {
      // Valid transition: pending -> confirmed
      const validRes = await request(app)
        .patch(`/api/admin/orders/${testOrderRef}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "confirmed", note: "Customer phone confirmed" });

      expect(validRes.status).toBe(200);
      expect(validRes.body.status).toBe("confirmed");
      expect(validRes.body.statusHistory.length).toBe(2);

      // Invalid transition: confirmed cannot go back to pending
      const invalidRes = await request(app)
        .patch(`/api/admin/orders/${testOrderRef}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "pending" });

      expect(invalidRes.status).toBe(400);
      expect(invalidRes.body.error.code).toBe("INVALID_STATUS_TRANSITION");
    });

    it("GET /api/admin/orders/export returns CSV file", async () => {
      const res = await request(app)
        .get("/api/admin/orders/export")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/csv");
      expect(res.text).toContain("Reference,Date,Status,Customer Name");
      expect(res.text).toContain(testOrderRef);
    });
  });

  describe("Admin CRM & Stats", () => {
    it("manages contact messages and exports CSV", async () => {
      const msg = await ContactMessage.create({
        name: "Test CRM",
        email: "crm@test.com",
        subject: "Question",
        message: "When will the next drop arrive?",
        status: "new",
      });

      const listRes = await request(app)
        .get("/api/admin/crm/contact?status=new")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(listRes.status).toBe(200);
      expect(listRes.body.items.length).toBeGreaterThanOrEqual(1);

      const patchRes = await request(app)
        .patch(`/api/admin/crm/contact/${msg.id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "read" });
      expect(patchRes.status).toBe(200);
      expect(patchRes.body.status).toBe("read");

      const csvRes = await request(app)
        .get("/api/admin/crm/contact/export")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(csvRes.status).toBe(200);
      expect(csvRes.headers["content-type"]).toContain("text/csv");
      expect(csvRes.text).toContain("Name,Email,Subject,Message,Status,Date");
    });

    it("lists newsletter subscribers and exports CSV", async () => {
      const res = await request(app)
        .get("/api/admin/crm/newsletter")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("items");

      const csvRes = await request(app)
        .get("/api/admin/crm/newsletter/export")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(csvRes.status).toBe(200);
      expect(csvRes.headers["content-type"]).toContain("text/csv");
      expect(csvRes.text).toContain("Email,Source,Unsubscribed,Date");
    });

    it("GET /api/admin/stats/affiliate-clicks aggregates clicks by product and day", async () => {
      await AffiliateClick.create({
        productSlug: "minimal-everyday-sneakers",
        retailer: "Sole Street",
        timestamp: new Date(),
      });

      const res = await request(app)
        .get("/api/admin/stats/affiliate-clicks")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("totalClicks");
      expect(res.body.totalClicks).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(res.body.byProduct)).toBe(true);
      expect(Array.isArray(res.body.byDay)).toBe(true);
    });
  });

  describe("Admin Image Upload", () => {
    it("uploads image file and returns public URL", async () => {
      // Create a small mock PNG buffer (1x1 pixel PNG)
      const pngBuffer = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "base64"
      );

      const res = await request(app)
        .post("/api/admin/uploads")
        .set("Authorization", `Bearer ${adminToken}`)
        .attach("image", pngBuffer, "test-upload.png");

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("url");
      expect(res.body.url).toContain("/static/");
      expect(res.body.mimetype).toBe("image/png");
    });

    it("rejects non-image files with 400", async () => {
      const textBuffer = Buffer.from("Hello text file");

      const res = await request(app)
        .post("/api/admin/uploads")
        .set("Authorization", `Bearer ${adminToken}`)
        .attach("image", textBuffer, "test-doc.txt");

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_FILE_TYPE");
    });
  });
});
