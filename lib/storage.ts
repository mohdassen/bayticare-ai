import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export type StoredObject = { key: string; sizeBytes: number; mimeType: string };

export interface StorageProvider {
  put(input: { bytes: Uint8Array; fileName: string; mimeType: string; ownerScope: string }): Promise<StoredObject>;
}

class LocalStorageProvider implements StorageProvider {
  async put(input: { bytes: Uint8Array; fileName: string; mimeType: string; ownerScope: string }): Promise<StoredObject> {
    const allowed = new Set(['application/pdf','image/jpeg','image/png','image/webp']);
    if (!allowed.has(input.mimeType)) throw new Error('Unsupported file type');
    const max = 10 * 1024 * 1024;
    if (input.bytes.byteLength > max) throw new Error('File exceeds 10 MB limit');
    const ext = path.extname(input.fileName).replace(/[^.a-zA-Z0-9]/g, '').slice(0, 8) || '.bin';
    const safeScope = input.ownerScope.replace(/[^a-zA-Z0-9_-]/g, '');
    const id = crypto.randomUUID();
    const key = `${safeScope}/${id}${ext}`;
    const root = path.join(process.cwd(), '.data', 'uploads', safeScope);
    await mkdir(root, { recursive: true });
    await writeFile(path.join(root, `${id}${ext}`), input.bytes);
    return { key, sizeBytes: input.bytes.byteLength, mimeType: input.mimeType };
  }
}

export function getStorageProvider(): StorageProvider {
  // Replace with S3-compatible adapter in production. Files are never exposed as public URLs here.
  return new LocalStorageProvider();
}
