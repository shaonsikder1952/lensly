import fs from "node:fs";
import path from "node:path";
import process from "node:process";

export const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.resolve(process.cwd(), "data");

// Ensure data directory exists synchronously upon module load
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (err) {
  console.error("[DataDir] Failed to ensure data directory exists:", err);
}

/**
 * Returns the resolved path to a JSON data file inside the data directory.
 * If the file exists in the legacy root directory but not yet in data/,
 * it automatically moves or copies it into data/ for seamless backward compatibility.
 */
export function getDataFilePath(filename: string): string {
  const targetPath = path.resolve(DATA_DIR, filename);
  const legacyRootPath = path.resolve(process.cwd(), filename);

  try {
    if (!fs.existsSync(targetPath) && fs.existsSync(legacyRootPath)) {
      fs.copyFileSync(legacyRootPath, targetPath);
    }
  } catch {
    // Graceful fallback to targetPath
  }

  return targetPath;
}
