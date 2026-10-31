import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { PRESET_MODELS, TRYON_ANGLES, aiTryonService } from "../src/services/aiTryon.js";
import { storageService } from "../src/services/storage.js";

describe("Phase 6: Cloud Storage & Gemini Virtual Try-On Studio", () => {
  const app = createApp();
  it("provides 4 curated streetwear preset models matching OFFSCRIPT aesthetic", () => {
    expect(PRESET_MODELS.length).toBeGreaterThanOrEqual(4);
    const ids = PRESET_MODELS.map((m) => m.id);
    expect(ids).toContain("preset-kai-male");
    expect(ids).toContain("preset-elena-female");
    expect(ids).toContain("preset-rei-unisex");
    expect(ids).toContain("preset-marcus-heavyweight");
  });

  it("defines the 4 required streetwear catalog angles (Front, 45 Side, Back, Detail)", () => {
    expect(TRYON_ANGLES.length).toBe(4);
    const angleIds = TRYON_ANGLES.map((a) => a.id);
    expect(angleIds).toEqual(["front", "side_45", "back", "detail"]);
  });

  it("storage service saves buffers and returns valid URLs", async () => {
    const dummyBuffer = Buffer.from("test-image-content");
    const savedUrl = await storageService.saveBuffer(dummyBuffer, "test-shot.jpg", "image/jpeg");
    expect(typeof savedUrl).toBe("string");
    expect(savedUrl.length).toBeGreaterThan(0);
  });

  it("generates 4 angles in demo/fallback mode without throwing", async () => {
    const response = await aiTryonService.generateMultiAngleShots({
      productName: "Heavyweight Boxy Hoodie",
      category: "Hoodies",
      productImage: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2",
      modelImage: "preset-kai-male",
    });

    expect(response.success).toBe(true);
    expect(response.images.length).toBe(4);
    const angles = response.images.map((img) => img.angleId);
    expect(angles).toEqual(["front", "side_45", "back", "detail"]);
    expect(response.images[0].imageUrl).toBeDefined();
  });

  it("unauthenticated request to /api/admin/ai/presets returns 401", async () => {
    const res = await request(app).get("/api/admin/ai/presets");
    expect(res.status).toBe(401);
  });
});
