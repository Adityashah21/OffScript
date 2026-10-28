import { pathToFileURL } from "url";
import bcrypt from "bcryptjs";
import { connectDB, disconnectDB } from "../config/db.js";
import { env } from "../config/env.js";
import { AdminUser } from "../models/AdminUser.js";

export async function createAdmin(): Promise<void> {
  await connectDB();
  console.log("Creating/updating admin user...");

  const email = env.ADMIN_EMAIL.toLowerCase().trim();
  const password = env.ADMIN_PASSWORD;

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const admin = await AdminUser.findOneAndUpdate(
    { email },
    { email, passwordHash, role: "admin" },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`✅ Admin user ready: ${admin.email}`);
}

// Execute directly if run via CLI
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createAdmin()
    .then(async () => {
      await disconnectDB();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error("❌ Failed to create admin user:", err);
      await disconnectDB();
      process.exit(1);
    });
}
