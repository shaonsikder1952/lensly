import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import crypto from "node:crypto";
import { getServerConfig } from "./config.server";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

export interface StoredFile {
  fileId: string;
  size: number;
  mimeType: string;
  originalName?: string;
  createdAt: string;
}

export interface StorageDriver {
  save(fileId: string, buffer: Buffer, mimeType: string, originalName?: string): Promise<StoredFile>;
  get(fileId: string): Promise<{ buffer: Buffer; mimeType: string; originalName?: string } | null>;
  delete(fileId: string): Promise<boolean>;
}

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

/**
 * Validates the file buffer against known magic-byte signatures.
 * Prevents file extension spoofing (e.g. executable or shell script renamed as .png).
 */
export function validateMagicBytes(buffer: Buffer): { valid: boolean; detectedMime: string | null; error?: string } {
  if (!buffer || buffer.length < 12) {
    return { valid: false, detectedMime: null, error: "File buffer is too small or empty" };
  }

  // Check for executable signatures and reject immediately
  // Windows PE (MZ)
  if (buffer[0] === 0x4d && buffer[1] === 0x5a) {
    return { valid: false, detectedMime: null, error: "Executable binaries are strictly prohibited" };
  }
  // Linux ELF (\x7FELF)
  if (buffer[0] === 0x7f && buffer[1] === 0x45 && buffer[2] === 0x4c && buffer[3] === 0x46) {
    return { valid: false, detectedMime: null, error: "Executable binaries are strictly prohibited" };
  }
  // Script shebang (#!)
  if (buffer[0] === 0x23 && buffer[1] === 0x21) {
    return { valid: false, detectedMime: null, error: "Executable scripts are strictly prohibited" };
  }

  // PDF: %PDF-
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  ) {
    return { valid: true, detectedMime: "application/pdf" };
  }

  // PNG: \x89PNG\r\n\x1a\n
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, detectedMime: "image/png" };
  }

  // JPEG: \xFF\xD8\xFF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, detectedMime: "image/jpeg" };
  }

  // WebP: RIFF....WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { valid: true, detectedMime: "image/webp" };
  }

  return {
    valid: false,
    detectedMime: null,
    error: "File content does not match allowed types (PDF, JPEG, PNG, WEBP).",
  };
}

/**
 * Local Disk Private Storage Driver
 */
class DiskStorageDriver implements StorageDriver {
  private baseDir: string;

  constructor(dirPath?: string) {
    this.baseDir = path.resolve(process.cwd(), dirPath || "./storage/private");
  }

  private async ensureDir(): Promise<void> {
    await fs.mkdir(this.baseDir, { recursive: true });
  }

  private getFilePath(fileId: string): string {
    // Prevent directory traversal: allow only strict UUID format
    const sanitizedId = fileId.replace(/[^a-zA-Z0-9_-]/g, "");
    if (!sanitizedId || sanitizedId !== fileId) {
      throw new Error("Invalid file ID");
    }
    const resolvedPath = path.resolve(this.baseDir, `${sanitizedId}.bin`);
    if (!resolvedPath.startsWith(this.baseDir)) {
      throw new Error("Path traversal detected");
    }
    return resolvedPath;
  }

  private getMetaPath(fileId: string): string {
    return `${this.getFilePath(fileId)}.json`;
  }

  async save(fileId: string, buffer: Buffer, mimeType: string, originalName?: string): Promise<StoredFile> {
    await this.ensureDir();
    const filePath = this.getFilePath(fileId);
    const metaPath = this.getMetaPath(fileId);

    const meta: StoredFile = {
      fileId,
      size: buffer.length,
      mimeType,
      originalName: originalName ? path.basename(originalName).slice(0, 100) : undefined,
      createdAt: new Date().toISOString(),
    };

    await fs.writeFile(filePath, buffer);
    await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), "utf-8");
    return meta;
  }

  async get(fileId: string): Promise<{ buffer: Buffer; mimeType: string; originalName?: string } | null> {
    try {
      const filePath = this.getFilePath(fileId);
      const metaPath = this.getMetaPath(fileId);

      const [buffer, metaStr] = await Promise.all([
        fs.readFile(filePath),
        fs.readFile(metaPath, "utf-8").catch(() => null),
      ]);

      let mimeType = "application/octet-stream";
      let originalName: string | undefined;

      if (metaStr) {
        try {
          const meta = JSON.parse(metaStr);
          mimeType = meta.mimeType || mimeType;
          originalName = meta.originalName;
        } catch {
          // fallback to magic bytes inspection
        }
      }

      if (mimeType === "application/octet-stream") {
        const magic = validateMagicBytes(buffer);
        if (magic.detectedMime) mimeType = magic.detectedMime;
      }

      return { buffer, mimeType, originalName };
    } catch (err: unknown) {
      if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "ENOENT") {
        return null;
      }
      throw err;
    }
  }

  async delete(fileId: string): Promise<boolean> {
    try {
      const filePath = this.getFilePath(fileId);
      const metaPath = this.getMetaPath(fileId);
      await Promise.all([
        fs.unlink(filePath).catch(() => {}),
        fs.unlink(metaPath).catch(() => {}),
      ]);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * S3 / Cloudflare R2 Object Storage Driver
 */
class S3StorageDriver implements StorageDriver {
  private client: S3Client;
  private bucket: string;

  constructor(config: {
    bucket: string;
    region?: string;
    endpoint?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
  }) {
    this.bucket = config.bucket;
    this.client = new S3Client({
      region: config.region || "auto",
      endpoint: config.endpoint,
      credentials:
        config.accessKeyId && config.secretAccessKey
          ? {
              accessKeyId: config.accessKeyId,
              secretAccessKey: config.secretAccessKey,
            }
          : undefined,
    });
  }

  async save(fileId: string, buffer: Buffer, mimeType: string, originalName?: string): Promise<StoredFile> {
    const key = `private/${fileId}.bin`;
    const sanitizedName = originalName ? path.basename(originalName).slice(0, 100) : "";

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        Metadata: {
          originalName: encodeURIComponent(sanitizedName),
          createdAt: new Date().toISOString(),
        },
      }),
    );

    return {
      fileId,
      size: buffer.length,
      mimeType,
      originalName: sanitizedName || undefined,
      createdAt: new Date().toISOString(),
    };
  }

  async get(fileId: string): Promise<{ buffer: Buffer; mimeType: string; originalName?: string } | null> {
    try {
      const key = `private/${fileId}.bin`;
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );

      if (!response.Body) return null;
      const chunks: Uint8Array[] = [];
      // @ts-expect-error Stream type compatibility
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);
      const mimeType = response.ContentType || "application/octet-stream";
      const rawName = response.Metadata?.originalname;
      const originalName = rawName ? decodeURIComponent(rawName) : undefined;

      return { buffer, mimeType, originalName };
    } catch (err: unknown) {
      if (err && typeof err === "object" && "name" in err && (err as { name: string }).name === "NoSuchKey") {
        return null;
      }
      throw err;
    }
  }

  async delete(fileId: string): Promise<boolean> {
    try {
      const key = `private/${fileId}.bin`;
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Production Durable Storage Guard:
 * When running in production (NODE_ENV === "production"), durable private storage
 * (S3 / Cloudflare R2) is mandatory. Ephemeral local disk storage is strictly forbidden.
 */
export function validateProductionStorageConfig(customEnv?: {
  nodeEnv?: string;
  s3Bucket?: string;
  s3AccessKeyId?: string;
  s3SecretAccessKey?: string;
}): void {
  const isProd =
    customEnv?.nodeEnv !== undefined
      ? customEnv.nodeEnv === "production"
      : process.env.NODE_ENV === "production";

  if (isProd) {
    const bucket = customEnv?.s3Bucket !== undefined ? customEnv.s3Bucket : process.env.S3_BUCKET;
    const keyId = customEnv?.s3AccessKeyId !== undefined ? customEnv.s3AccessKeyId : process.env.S3_ACCESS_KEY_ID;
    const secret = customEnv?.s3SecretAccessKey !== undefined ? customEnv.s3SecretAccessKey : process.env.S3_SECRET_ACCESS_KEY;

    if (!bucket || !keyId || !secret) {
      throw new Error(
        "[Lensly Production Guard] Durable private storage (S3/R2) is mandatory in production. S3_BUCKET, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY must be configured. Local disk fallback is prohibited in production.",
      );
    }
  }
}

let activeDriver: StorageDriver | null = null;

export function getStorageDriver(): StorageDriver {
  validateProductionStorageConfig();
  if (activeDriver) return activeDriver;

  const config = getServerConfig();
  if (config.s3Bucket) {
    activeDriver = new S3StorageDriver({
      bucket: config.s3Bucket,
      region: config.s3Region,
      endpoint: config.s3Endpoint,
      accessKeyId: config.s3AccessKeyId,
      secretAccessKey: config.s3SecretAccessKey,
    });
    console.log(`[Storage] Initialized private S3/R2 storage driver for bucket "${config.s3Bucket}"`);
  } else {
    activeDriver = new DiskStorageDriver(config.storageDir);
    console.log(`[Storage] Initialized private local disk storage driver at "${config.storageDir}"`);
  }
  return activeDriver;
}

/**
 * Validates, hardens, and saves a file buffer into private storage.
 */
export async function savePrivateFile(
  buffer: Buffer,
  declaredMimeType: string,
  originalName?: string,
): Promise<{ success: true; file: StoredFile } | { success: false; error: string }> {
  validateProductionStorageConfig();

  // 1. Size check
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    return { success: false, error: "File exceeds 10MB limit." };
  }
  if (buffer.length === 0) {
    return { success: false, error: "Empty file upload." };
  }

  // 2. MIME whitelist check
  if (!ALLOWED_MIME_TYPES.has(declaredMimeType)) {
    return {
      success: false,
      error: `Invalid file type "${declaredMimeType}". Only PDF, JPEG, PNG, and WebP are supported.`,
    };
  }

  // 3. Magic-byte signature verification
  const magic = validateMagicBytes(buffer);
  if (!magic.valid) {
    return { success: false, error: magic.error || "File validation failed." };
  }

  // 4. Mismatch detection: if declared MIME doesn't match detected magic byte MIME
  if (magic.detectedMime !== declaredMimeType) {
    // Tolerate image/jpeg vs image/jpg
    const isJpeg = (magic.detectedMime === "image/jpeg" && declaredMimeType === "image/jpg") ||
                   (magic.detectedMime === "image/jpeg" && declaredMimeType === "image/jpeg");
    if (!isJpeg) {
      return {
        success: false,
        error: `File content (${magic.detectedMime}) does not match declared type (${declaredMimeType}).`,
      };
    }
  }

  // 5. Generate secure random UUID file ID
  const fileId = crypto.randomUUID();
  const driver = getStorageDriver();
  const file = await driver.save(fileId, buffer, magic.detectedMime || declaredMimeType, originalName);

  return { success: true, file };
}

/**
 * Parses and saves a base64 data URL into private storage.
 */
export async function saveBase64Upload(
  base64DataUrl: string,
  originalName?: string,
): Promise<{ success: true; file: StoredFile } | { success: false; error: string }> {
  try {
    const match = base64DataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      return { success: false, error: "Invalid Base64 data format." };
    }

    const mimeType = match[1].toLowerCase().trim();
    const rawBase64 = match[2];
    const buffer = Buffer.from(rawBase64, "base64");

    return await savePrivateFile(buffer, mimeType, originalName);
  } catch (err) {
    console.error("Failed to process Base64 file upload:", err);
    return { success: false, error: "Failed to decode and save file." };
  }
}

/**
 * Retrieves a private file buffer by ID.
 */
export async function getPrivateFile(
  fileId: string,
): Promise<{ buffer: Buffer; mimeType: string; originalName?: string } | null> {
  const driver = getStorageDriver();
  return await driver.get(fileId);
}

/**
 * Deletes a private file by ID.
 */
export async function deletePrivateFile(fileId: string): Promise<boolean> {
  const driver = getStorageDriver();
  return await driver.delete(fileId);
}

/**
 * Generates a 128-bit cryptographically secure random tracking ID.
 * Format: LNS-REQ-<32 HEX CHARACTERS>
 */
export function generateTrackingId(): string {
  const randomEntropy = crypto.randomBytes(16).toString("hex").toUpperCase();
  return `LNS-REQ-${randomEntropy}`;
}
