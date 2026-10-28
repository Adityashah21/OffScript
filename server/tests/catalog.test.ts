import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../src/app.js";
import { connectDB, disconnectDB } from "../src/config/db.js";
import { seed } from "../src/scripts/seed.js";
import { Collection } from "../src/models/Collection.js";
import { Product } from "../src/models/Product.js";
import { buildMongoFilter } from "../src/services/collectionMatcher.js";

describe("Phase 3: Catalog & Search API Tests", () => {
  let mongoServer: MongoMemoryServer;
  const app = createApp();

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

  describe("Collection Matcher Parity with Client", () => {
    const expectedCounts: Record<string, number> = {
      discover: 14,
      "new-arrivals": 5,
      women: 12,
      men: 9,
      streetwear: 3,
      accessories: 3,
      "everyday-uniform": 6,
      "her-rotation": 4,
      "his-rotation": 3,
      "under-499": 2,
      "under-999": 7,
      "under-1999": 14,
      "oversized-tees": 2,
      "coffee-date": 3,
      "clean-fit": 5,
      "college-core": 5,
      monochrome: 2,
      "sneaker-edit": 1,
      "weekend-plans": 5,
      "date-night": 4,
      "travel-fits": 6,
      "going-out": 4,
      "off-duty": 8,
      "main-character": 5,
      "soft-hours": 3,
      featured: 9,
      "viral-finds": 4,
    };

    it("verifies match rule product counts for every single collection against expected client parity", async () => {
      const collections = await Collection.find();
      expect(collections.length).toBe(27);

      for (const col of collections) {
        const filter = buildMongoFilter(col.match);
        const count = await Product.countDocuments(filter);
        const expected = expectedCounts[col.slug];
        expect(
          count,
          `Collection '${col.slug}' count mismatch: expected ${expected}, got ${count}`
        ).toBe(expected);
      }
    });
  });

  describe("GET /api/products", () => {
    it("returns paginated products with total and items", async () => {
      const res = await request(app).get("/api/products?page=1&limit=5");
      expect(res.status).toBe(200);
      expect(res.body.items.length).toBe(5);
      expect(res.body.total).toBe(14);
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(5);
    });

    it("filters by collection slug", async () => {
      const res = await request(app).get("/api/products?collection=oversized-tees");
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(2);
      for (const item of res.body.items) {
        expect(item.collectionIds).toContain("oversized-tees");
      }
    });

    it("filters by category", async () => {
      const res = await request(app).get("/api/products?category=Accessories");
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(3);
      for (const item of res.body.items) {
        expect(item.category).toBe("Accessories");
      }
    });

    it("filters by price bucket u500", async () => {
      const res = await request(app).get("/api/products?price=u500");
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(2);
      for (const item of res.body.items) {
        expect(item.price).toBeLessThan(500);
      }
    });

    it("filters by retailer", async () => {
      const res = await request(app).get("/api/products?retailer=Denimwala");
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
      expect(res.body.items[0].slug).toBe("straight-fit-denim");
    });

    it("filters by inStock", async () => {
      const res = await request(app).get("/api/products?inStock=true");
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(13); // 14 total - 1 out of stock (tortoise sunglasses)
      for (const item of res.body.items) {
        expect(item.inStock).toBe(true);
      }
    });

    it("sorts by price-asc", async () => {
      const res = await request(app).get("/api/products?sort=price-asc&limit=14");
      expect(res.status).toBe(200);
      const prices = res.body.items.map((i: any) => i.price);
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
      }
    });

    it("sorts by price-desc", async () => {
      const res = await request(app).get("/api/products?sort=price-desc&limit=14");
      expect(res.status).toBe(200);
      const prices = res.body.items.map((i: any) => i.price);
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeLessThanOrEqual(prices[i - 1]);
      }
    });

    it("sorts by recommended (editorsPick + featured)", async () => {
      const res = await request(app).get("/api/products?sort=recommended&limit=5");
      expect(res.status).toBe(200);
      // Items that are both editors pick and featured have score 3
      const first = res.body.items[0];
      const score = (p: any) => (p.isEditorsPick ? 2 : 0) + (p.isFeatured ? 1 : 0);
      expect(score(first)).toBe(3);
    });
  });

  describe("GET /api/products/:slug", () => {
    it("returns product along with similar, collection, and budget rails", async () => {
      const res = await request(app).get("/api/products/washed-black-oversized-tee");
      expect(res.status).toBe(200);
      expect(res.body.slug).toBe("washed-black-oversized-tee");
      expect(res.body).toHaveProperty("similar");
      expect(res.body).toHaveProperty("collection");
      expect(res.body).toHaveProperty("budget");

      // Verify rails
      expect(Array.isArray(res.body.similar)).toBe(true);
      expect(Array.isArray(res.body.collection)).toBe(true);
      expect(Array.isArray(res.body.budget)).toBe(true);

      for (const item of res.body.similar) {
        expect(item.category).toBe("Tops");
        expect(item.slug).not.toBe("washed-black-oversized-tee");
      }
      for (const item of res.body.budget) {
        expect(Math.abs(item.price - 699)).toBeLessThanOrEqual(400);
      }
    });

    it("returns 404 for unknown product slug", async () => {
      const res = await request(app).get("/api/products/unknown-piece-slug");
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("PRODUCT_NOT_FOUND");
    });
  });

  describe("GET /api/products/filters", () => {
    it("returns filter options for all products", async () => {
      const res = await request(app).get("/api/products/filters");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("category");
      expect(res.body).toHaveProperty("retailer");
      expect(res.body).toHaveProperty("size");
      expect(res.body).toHaveProperty("color");
      expect(res.body.category.length).toBeGreaterThan(0);
    });

    it("returns filter options narrowed to a collection", async () => {
      const res = await request(app).get("/api/products/filters?collection=accessories");
      expect(res.status).toBe(200);
      expect(res.body.category).toEqual(["Accessories"]);
    });
  });

  describe("GET /api/collections", () => {
    it("returns all collections with productCount", async () => {
      const res = await request(app).get("/api/collections");
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(27);
      for (const col of res.body) {
        expect(typeof col.productCount).toBe("number");
      }
    });

    it("supports ?surface=trend", async () => {
      const res = await request(app).get("/api/collections?surface=trend");
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(6);
      expect(res.body[0].slug).toBe("oversized-tees");
      expect(res.body[5].slug).toBe("sneaker-edit");
    });

    it("supports ?surface=occasion", async () => {
      const res = await request(app).get("/api/collections?surface=occasion");
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(6);
      expect(res.body[0].slug).toBe("college-core");
      expect(res.body[0].label).toBe("College Days");
    });

    it("supports ?surface=mood", async () => {
      const res = await request(app).get("/api/collections?surface=mood");
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(6);
      expect(res.body[0].slug).toBe("off-duty");
      expect(res.body[0].label).toBe("Off-Duty");
      expect(res.body[0].note).toBe("No plans, good fit");
    });

    it("GET /api/collections/:slug returns collection with productCount", async () => {
      const res = await request(app).get("/api/collections/clean-fit");
      expect(res.status).toBe(200);
      expect(res.body.slug).toBe("clean-fit");
      expect(res.body.productCount).toBe(5);
    });

    it("GET /api/collections/:slug returns 404 for unknown slug", async () => {
      const res = await request(app).get("/api/collections/unknown-col");
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("COLLECTION_NOT_FOUND");
    });
  });

  describe("GET /api/edits", () => {
    it("returns all edits with resolved collection and relatedCollections with counts", async () => {
      const res = await request(app).get("/api/edits");
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(5);

      const first = res.body[0];
      expect(first.collection).toHaveProperty("productCount");
      expect(Array.isArray(first.relatedCollections)).toBe(true);
      for (const rel of first.relatedCollections) {
        expect(rel).toHaveProperty("productCount");
      }
    });

    it("GET /api/edits/:slug returns single edit with resolved collections", async () => {
      const res = await request(app).get("/api/edits/oversized-tees");
      expect(res.status).toBe(200);
      expect(res.body.slug).toBe("oversized-tees");
      expect(res.body.collection.slug).toBe("oversized-tees");
      expect(res.body.collection.productCount).toBe(2);
      expect(res.body.relatedCollections.length).toBe(3);
    });

    it("GET /api/edits/:slug returns 404 for non-existent edit", async () => {
      const res = await request(app).get("/api/edits/unknown-edit");
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("EDIT_NOT_FOUND");
    });
  });

  describe("GET /api/search", () => {
    it("matches 'under 1000' budget queries", async () => {
      const res = await request(app).get("/api/search?q=under%201000");
      expect(res.status).toBe(200);
      expect(res.body.products.length).toBe(7);
      for (const p of res.body.products) {
        expect(p.price).toBeLessThanOrEqual(1000);
      }
    });

    it("matches 'black oversized tee'", async () => {
      const res = await request(app).get("/api/search?q=black%20oversized%20tee");
      expect(res.status).toBe(200);
      expect(res.body.products.length).toBeGreaterThan(0);
      expect(res.body.products[0].slug).toBe("washed-black-oversized-tee");
    });

    it("matches 'college outfits' and trims plural 'outfits'", async () => {
      const res = await request(app).get("/api/search?q=college%20outfits");
      expect(res.status).toBe(200);
      expect(res.body.products.length).toBeGreaterThan(0);
      expect(res.body.collections.some((c: any) => c.slug === "college-core")).toBe(true);
    });

    it("returns empty arrays for empty query", async () => {
      const res = await request(app).get("/api/search?q=");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ products: [], collections: [] });
    });
  });
});
