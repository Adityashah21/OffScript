import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { connectDB, disconnectDB } from "../config/db.js";
import { env } from "../config/env.js";
import { Product } from "../models/Product.js";
import { Collection } from "../models/Collection.js";
import { Edit } from "../models/Edit.js";
import { getSeedProducts, getSeedCollections, getSeedEdits } from "./seedData.js";
import { createAdmin } from "./createAdmin.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export async function copyAssets() {
    const clientAssetsDir = path.resolve(__dirname, "../../../client/src/assets");
    const serverSeedDir = path.resolve(__dirname, "../../uploads/seed");
    if (!fs.existsSync(serverSeedDir)) {
        fs.mkdirSync(serverSeedDir, { recursive: true });
    }
    if (fs.existsSync(clientAssetsDir)) {
        const files = fs.readdirSync(clientAssetsDir);
        for (const file of files) {
            if (/\.(jpg|jpeg|png|webp)$/i.test(file)) {
                const srcPath = path.join(clientAssetsDir, file);
                const destPath = path.join(serverSeedDir, file);
                if (!fs.existsSync(destPath)) {
                    try {
                        fs.copyFileSync(srcPath, destPath);
                    }
                    catch (err) {
                        if (err.code !== "EBUSY") {
                            console.warn(`Could not copy asset ${file}:`, err.message);
                        }
                    }
                }
            }
        }
        console.log(`📸 Copied static assets to ${serverSeedDir}`);
    }
    else {
        console.warn(`⚠️ Client assets directory not found at ${clientAssetsDir}, skipping file copy.`);
    }
}
export async function seed(baseUrl = env.PUBLIC_BASE_URL) {
    await connectDB();
    console.log("🌱 Starting database seeding...");
    // 1. Copy image assets
    await copyAssets();
    // 2. Seed Products
    const seedProducts = getSeedProducts(baseUrl);
    for (const prod of seedProducts) {
        await Product.findOneAndUpdate({ slug: prod.slug }, prod, {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
            runValidators: true,
        });
    }
    console.log(`✅ Seeded ${seedProducts.length} products`);
    // 3. Seed Collections
    const seedCollections = getSeedCollections(baseUrl);
    for (const col of seedCollections) {
        await Collection.findOneAndUpdate({ slug: col.slug }, col, {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
            runValidators: true,
        });
    }
    console.log(`✅ Seeded ${seedCollections.length} collections`);
    // 4. Seed Edits
    const seedEdits = getSeedEdits(baseUrl);
    for (const ed of seedEdits) {
        await Edit.findOneAndUpdate({ slug: ed.slug }, ed, {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
            runValidators: true,
        });
    }
    console.log(`✅ Seeded ${seedEdits.length} edits`);
    // 5. Seed Admin User
    await createAdmin();
    console.log("🎉 Seeding completed successfully!");
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    seed()
        .then(async () => {
        await disconnectDB();
        process.exit(0);
    })
        .catch(async (err) => {
        console.error("❌ Seeding failed:", err);
        await disconnectDB();
        process.exit(1);
    });
}
