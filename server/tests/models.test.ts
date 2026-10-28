import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { Product } from "../src/models/Product.js";
import { Collection } from "../src/models/Collection.js";
import { Edit } from "../src/models/Edit.js";
import { AdminUser } from "../src/models/AdminUser.js";
import { ContactMessage } from "../src/models/ContactMessage.js";
import { NewsletterSubscriber } from "../src/models/NewsletterSubscriber.js";
import { seed } from "../src/scripts/seed.js";
import { connectDB, disconnectDB } from "../src/config/db.js";

describe("Phase 2: Models & Seed Verification", () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await connectDB(uri);
  });

  afterAll(async () => {
    await disconnectDB();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  it("enforces Product invariant: codEnabled === (purchaseMode === 'authorized_cod')", async () => {
    const invalidProduct = new Product({
      slug: "invalid-cod-test",
      name: "Invalid COD Test",
      description: "Testing invariant",
      category: "Tops",
      subcategory: "Tees",
      gender: "unisex",
      retailer: "Test Retailer",
      brand: "Test Brand",
      price: 500,
      currency: "INR",
      images: ["http://localhost:5000/static/seed/p-tee.jpg"],
      purchaseMode: "affiliate",
      codEnabled: true, // Invariant violation: affiliate cannot have codEnabled = true
      lastUpdatedAt: new Date().toISOString(),
    });

    let err: unknown;
    try {
      await invalidProduct.validate();
    } catch (e) {
      err = e;
    }
    expect(err).toBeDefined();
  });

  it("enforces Product invariant: originalPrice must be greater than price", async () => {
    const invalidProduct = new Product({
      slug: "invalid-price-test",
      name: "Invalid Price Test",
      description: "Testing price invariant",
      category: "Tops",
      subcategory: "Tees",
      gender: "unisex",
      retailer: "Test Retailer",
      brand: "Test Brand",
      price: 500,
      originalPrice: 400, // Invalid: originalPrice must be > price
      currency: "INR",
      images: ["http://localhost:5000/static/seed/p-tee.jpg"],
      purchaseMode: "affiliate",
      codEnabled: false,
      lastUpdatedAt: new Date().toISOString(),
    });

    let err: unknown;
    try {
      await invalidProduct.validate();
    } catch (e) {
      err = e;
    }
    expect(err).toBeDefined();
  });

  it("Product toJSON transforms _id to string id and strips __v", async () => {
    const validProduct = new Product({
      slug: "json-transform-test",
      name: "Transform Test",
      description: "Testing toJSON",
      category: "Shirts",
      subcategory: "Casual",
      gender: "men",
      retailer: "Retailer",
      brand: "Brand",
      price: 800,
      currency: "INR",
      images: ["http://localhost:5000/static/seed/p-shirt.jpg"],
      purchaseMode: "affiliate",
      codEnabled: false,
      lastUpdatedAt: new Date().toISOString(),
    });

    const json = validProduct.toJSON();
    expect(json).toHaveProperty("id");
    expect(typeof json.id).toBe("string");
    expect(json).not.toHaveProperty("_id");
    expect(json).not.toHaveProperty("__v");
  });

  it("executes seed script and seeds exactly 14 products, 27 collections, 5 edits idempotently", async () => {
    await seed("http://localhost:5000");

    const productCount = await Product.countDocuments();
    expect(productCount).toBe(14);

    const collectionCount = await Collection.countDocuments();
    expect(collectionCount).toBe(27);

    const editCount = await Edit.countDocuments();
    expect(editCount).toBe(5);

    const adminCount = await AdminUser.countDocuments();
    expect(adminCount).toBe(1);

    // Verify seed is idempotent
    await seed("http://localhost:5000");
    expect(await Product.countDocuments()).toBe(14);
    expect(await Collection.countDocuments()).toBe(27);
    expect(await Edit.countDocuments()).toBe(5);
  });

  it("verifies all seeded products obey the COD and price invariants", async () => {
    const products = await Product.find();
    expect(products.length).toBe(14);

    for (const p of products) {
      expect(p.codEnabled).toBe(p.purchaseMode === "authorized_cod");
      if (p.originalPrice !== undefined && p.originalPrice !== null) {
        expect(p.originalPrice).toBeGreaterThan(p.price);
      }
      expect(p.currency).toBe("INR");
      expect(p.images.length).toBeGreaterThan(0);
    }
  });

  it("ContactMessage and NewsletterSubscriber models store and transform correctly", async () => {
    const msg = await ContactMessage.create({
      name: "Test User",
      email: "test@example.com",
      subject: "Collaboration",
      message: "Hello team, I would like to collaborate.",
    });
    expect(msg.status).toBe("new");
    const msgJson = msg.toJSON();
    expect(msgJson).toHaveProperty("id");
    expect(msgJson).not.toHaveProperty("_id");

    const sub = await NewsletterSubscriber.create({
      email: "SUBSCRIBER@example.com",
      source: "footer",
    });
    expect(sub.email).toBe("subscriber@example.com");
    expect(sub.unsubscribeToken).toBeDefined();
    const subJson = sub.toJSON();
    expect(subJson).not.toHaveProperty("unsubscribeToken");
  });
});
