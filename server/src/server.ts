import { createApp } from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { createAdmin } from "./scripts/createAdmin.js";
import { Product } from "./models/Product.js";
import { seed } from "./scripts/seed.js";

async function bootstrap() {
  try {
    await connectDB();
    console.log("Connected to MongoDB successfully");

    // Automatically ensure admin user exists in MongoDB on server start
    await createAdmin();

    // Auto-seed initial catalog if MongoDB has no products yet
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      console.log("Database has 0 products. Auto-seeding initial catalog...");
      await seed();
    }

    const app = createApp();

    const server = app.listen(env.PORT, () => {
      console.log(`OFFSCRIPT server listening on port ${env.PORT} (${env.NODE_ENV})`);
    });

    const shutdown = async (signal: string) => {
      console.log(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        console.log("HTTP server closed.");
        process.exit(0);
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

bootstrap();
