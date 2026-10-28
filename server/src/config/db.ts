import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDB(uri?: string): Promise<typeof mongoose> {
  const mongoUri = uri || env.MONGODB_URI;
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }
  return mongoose.connect(mongoUri);
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
