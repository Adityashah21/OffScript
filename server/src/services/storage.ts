import path from "path";
import { env } from "../config/env.js";

export interface IStorageService {
  saveFile(file: Express.Multer.File): Promise<string>;
}

export class LocalStorageService implements IStorageService {
  async saveFile(file: Express.Multer.File): Promise<string> {
    const filename = path.basename(file.path);
    return `${env.PUBLIC_BASE_URL}/static/${filename}`;
  }
}

// Default storage instance (can be swapped with CloudinaryService later)
export const storageService: IStorageService = new LocalStorageService();
