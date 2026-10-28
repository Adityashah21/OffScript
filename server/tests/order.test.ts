import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../src/app.js";
import { connectDB, disconnectDB } from "../src/config/db.js";
import { seed } from "../src/scripts/seed.js";
import { Product } from "../src/models/Product.js";
import { Order } from "../src/models/Order.js";
import { ContactMessage } from "../src/models/ContactMessage.js";
import { NewsletterSubscriber } from "../src/models/NewsletterSubscriber.js";
import { AffiliateClick } from "../src/models/AffiliateClick.js";

describe("Phase 4: Orders, Contact, Newsletter & Affiliate Tests", () => {
  let mongoServer: MongoMemoryServer;
  const app = createApp();

  const validOrderInput = {
    productSlug: "washed-black-oversized-tee",
    fullName: "Asha Rao",
    mobile: "9876543210",
    email: "asha@example.com",
    house: "12B",
    street: "MG Road",
    landmark: "Near Metro",
    city: "Pune",
    state: "Maharashtra",
    pin: "411001",
    size: "M",
    color: "Washed Black",
    quantity: 1,
    instructions: "Leave at front door",
    confirmed: true,
  };

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await connectDB(uri);
    await seed("http://localhost:5000");
  });

  afterAll(async () => {
    await disconnectDB();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  describe("Parity with client/src/test/order.test.ts", () => {
    it("purchaseMode and codEnabled agree for every seeded product in DB", async () => {
      const products = await Product.find();
      for (const p of products) {
        expect(p.codEnabled).toBe(p.purchaseMode === "authorized_cod");
      }
    });

    it("identifies COD eligible vs non-eligible products", async () => {
      const tee = await Product.findOne({ slug: "washed-black-oversized-tee" });
      const shirt = await Product.findOne({ slug: "relaxed-fit-everyday-shirt" });

      expect(tee?.purchaseMode === "authorized_cod" && tee?.codEnabled).toBe(true);
      expect(shirt?.purchaseMode === "authorized_cod" && shirt?.codEnabled).toBe(false);
    });
  });

  describe("POST /api/orders validation & security", () => {
    it("rejects affiliate piece with 422 and details.product", async () => {
      const res = await request(app)
        .post("/api/orders")
        .send({
          ...validOrderInput,
          productSlug: "relaxed-fit-everyday-shirt", // affiliate piece
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(res.body.error.details.product).toBe("This piece isn't available for cash on delivery.");
    });

    it("rejects out of stock piece", async () => {
      // Temporarily mark a cod piece as out of stock
      await Product.updateOne({ slug: "washed-black-oversized-tee" }, { inStock: false });

      const res = await request(app).post("/api/orders").send(validOrderInput);
      expect(res.status).toBe(422);
      expect(res.body.error.details.product).toBe("This piece is currently out of stock.");

      // Revert back to inStock: true
      await Product.updateOne({ slug: "washed-black-oversized-tee" }, { inStock: true });
    });

    it("rejects invalid mobile numbers (non-Indian or non 10-digit)", async () => {
      const res = await request(app)
        .post("/api/orders")
        .send({ ...validOrderInput, mobile: "1234567890" });

      expect(res.status).toBe(422);
      expect(res.body.error.details.mobile).toBeDefined();
    });

    it("rejects invalid PIN code", async () => {
      const res = await request(app)
        .post("/api/orders")
        .send({ ...validOrderInput, pin: "41100" });

      expect(res.status).toBe(422);
      expect(res.body.error.details.pin).toBeDefined();
    });

    it("requires size if product has availableSizes and rejects invalid size", async () => {
      const res = await request(app)
        .post("/api/orders")
        .send({ ...validOrderInput, size: "" });

      expect(res.status).toBe(422);
      expect(res.body.error.details.size).toBeDefined();

      const invalidSizeRes = await request(app)
        .post("/api/orders")
        .send({ ...validOrderInput, size: "XXXL" });

      expect(invalidSizeRes.status).toBe(422);
      expect(invalidSizeRes.body.error.details.size).toBeDefined();
    });

    it("rejects invalid quantity (e.g. 6 or 0)", async () => {
      const res = await request(app)
        .post("/api/orders")
        .send({ ...validOrderInput, quantity: 6 });

      expect(res.status).toBe(422);
      expect(res.body.error.details.quantity).toBeDefined();
    });

    it("requires confirmed: true", async () => {
      const res = await request(app)
        .post("/api/orders")
        .send({ ...validOrderInput, confirmed: false });

      expect(res.status).toBe(422);
      expect(res.body.error.details.confirmed).toBeDefined();
    });

    it("successfully creates an order and correctly recomputes totals ignoring client tampering", async () => {
      const res = await request(app)
        .post("/api/orders")
        .send({
          ...validOrderInput,
          mobile: "9876500001",
          quantity: 2,
          // Attacker attempts to tamper with prices:
          itemTotal: 10,
          shipping: 0,
          grandTotal: 10,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("ref");
      expect(res.body.ref).toMatch(/^OS-\d{8}-[A-Z0-9]{6}$/);
      expect(res.body.status).toBe("pending");
      expect(res.body.product.name).toBe("Washed Black Oversized Tee");
      expect(res.body.size).toBe("M");
      expect(res.body.quantity).toBe(2);

      // Server recomputed totals: 699 * 2 + 49 = 1447
      expect(res.body.itemTotal).toBe(699 * 2);
      expect(res.body.shipping).toBe(49);
      expect(res.body.grandTotal).toBe(699 * 2 + 49);

      // Check DB order snapshot
      const orderInDb = await Order.findOne({ ref: res.body.ref });
      expect(orderInDb).toBeDefined();
      expect(orderInDb?.paymentMode).toBe("COD");
      expect(orderInDb?.confirmedDetails).toBe(true);
      expect(orderInDb?.ipHash).toBeDefined();
    });

    it("rejects duplicate order within 10 minutes", async () => {
      const mobile = "9876500002";
      const payload = { ...validOrderInput, mobile };

      const first = await request(app).post("/api/orders").send(payload);
      expect(first.status).toBe(201);

      const duplicate = await request(app).post("/api/orders").send(payload);
      expect(duplicate.status).toBe(429);
      expect(duplicate.body.error.code).toBe("DUPLICATE_ORDER");
    });

    it("supports Idempotency-Key header", async () => {
      const key = "test-idempotency-key-" + Date.now();
      const mobile = "9876500003";

      const first = await request(app)
        .post("/api/orders")
        .set("Idempotency-Key", key)
        .send({ ...validOrderInput, mobile });

      expect(first.status).toBe(201);

      const second = await request(app)
        .post("/api/orders")
        .set("Idempotency-Key", key)
        .send({ ...validOrderInput, mobile });

      expect(second.status).toBe(201);
      expect(second.body.ref).toBe(first.body.ref);
    });
  });

  describe("Contact & Newsletter Endpoints", () => {
    it("POST /api/contact validates input and stores message", async () => {
      const res = await request(app).post("/api/contact").send({
        name: "Vikram Malhotra",
        email: "vikram@example.com",
        subject: "Collaboration Enquiry",
        message: "We would love to feature our sustainable brand on OFFSCRIPT.",
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const inDb = await ContactMessage.findOne({ email: "vikram@example.com" });
      expect(inDb).toBeDefined();
      expect(inDb?.status).toBe("new");
    });

    it("POST /api/contact rejects message shorter than 10 characters", async () => {
      const res = await request(app).post("/api/contact").send({
        name: "Vikram",
        email: "vikram@example.com",
        subject: "Hi",
        message: "Short",
      });

      expect(res.status).toBe(422);
      expect(res.body.error.details.message).toBeDefined();
    });

    it("POST /api/newsletter accepts valid email and is idempotent", async () => {
      const email = "sub_test@example.com";
      const first = await request(app).post("/api/newsletter").send({ email });
      expect(first.status).toBe(200);
      expect(first.body.success).toBe(true);

      // Re-subscribing returns success without leaking
      const second = await request(app).post("/api/newsletter").send({ email });
      expect(second.status).toBe(200);
      expect(second.body.success).toBe(true);

      const count = await NewsletterSubscriber.countDocuments({ email });
      expect(count).toBe(1);
    });

    it("GET /api/newsletter/unsubscribe unsets subscriber", async () => {
      const subscriber = await NewsletterSubscriber.findOne({ email: "sub_test@example.com" });
      expect(subscriber).toBeDefined();

      const res = await request(app).get(`/api/newsletter/unsubscribe?token=${subscriber!.unsubscribeToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updated = await NewsletterSubscriber.findOne({ email: "sub_test@example.com" });
      expect(updated?.unsubscribed).toBe(true);
    });
  });

  describe("Affiliate Redirect", () => {
    it("GET /r/:slug redirects 302 to retailer affiliate link and logs AffiliateClick", async () => {
      const res = await request(app).get("/r/relaxed-fit-everyday-shirt?utm_source=instagram&utm_medium=reel");
      expect(res.status).toBe(302);
      expect(res.header.location).toBe(
        "https://example.com/retailer/relaxed-fit-everyday-shirt?ref=offscript-demo"
      );

      // Verify click was logged
      const click = await AffiliateClick.findOne({ productSlug: "relaxed-fit-everyday-shirt" });
      expect(click).toBeDefined();
      expect(click?.retailer).toBe("Thread & Co.");
      expect(click?.attribution?.utm_source).toBe("instagram");
    });

    it("GET /r/:slug returns 404 if product has no affiliateUrl or is in authorized_cod mode", async () => {
      const res = await request(app).get("/r/washed-black-oversized-tee");
      expect(res.status).toBe(404);
    });
  });
});
