import path from "path";
import { env } from "../config/env.js";
export class LocalStorageService {
    async saveFile(file) {
        const filename = path.basename(file.path);
        return `${env.PUBLIC_BASE_URL}/static/${filename}`;
    }
}
// Default storage instance (can be swapped with CloudinaryService later)
export const storageService = new LocalStorageService();
