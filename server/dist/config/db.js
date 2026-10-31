import mongoose from "mongoose";
import { env } from "./env.js";
export async function connectDB(uri) {
    const mongoUri = uri || env.MONGODB_URI;
    if (mongoose.connection.readyState === 1) {
        return mongoose;
    }
    return mongoose.connect(mongoUri);
}
export async function disconnectDB() {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
}
