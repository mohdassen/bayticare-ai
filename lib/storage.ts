import { mkdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export type StoredObject = { key: string; sizeBytes: number; mimeType: string };

const ALLOWED_MIME = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 10 * 1024 * 1024;

export interface StorageProvider {
  upload(input: { bytes: Uint8Array; fileName: string; mimeType: string; ownerScope: string }): Promise<StoredObject>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
  exists(key: string): Promise<boolean>;
}

function safeKey(ownerScope: string, fileName: string): { key: string; id: string; ext: string } {
  const ext = path.extname(fileName).replace(/[^.a-zA-Z0-9]/g, '').slice(0, 8) || '.bin';
  const scope = ownerScope.replace(/[^a-zA-Z0-9_-]/g, '');
  const id = crypto.randomUUID();
  return { key: `${scope}/${id}${ext}`, id, ext };
}

/**
 * Local filesystem storage. Only suitable for local development — Vercel's
 * filesystem is ephemeral, so anything written here does not survive a
 * redeploy or a cold start on a different instance. Never exposes files as
 * public URLs by design; getSignedUrl intentionally throws.
 */
class LocalStorageProvider implements StorageProvider {
  private root(scope: string) { return path.join(process.cwd(), '.data', 'uploads', scope); }

  async upload(input: { bytes: Uint8Array; fileName: string; mimeType: string; ownerScope: string }): Promise<StoredObject> {
    if (!ALLOWED_MIME.has(input.mimeType)) throw new Error('Unsupported file type');
    if (input.bytes.byteLength > MAX_BYTES) throw new Error('File exceeds 10 MB limit');
    const scope = input.ownerScope.replace(/[^a-zA-Z0-9_-]/g, '');
    const { key, id, ext } = safeKey(input.ownerScope, input.fileName);
    const root = this.root(scope);
    await mkdir(root, { recursive: true });
    await writeFile(path.join(root, `${id}${ext}`), input.bytes);
    return { key, sizeBytes: input.bytes.byteLength, mimeType: input.mimeType };
  }

  async delete(key: string): Promise<void> {
    const full = path.join(process.cwd(), '.data', 'uploads', key);
    await unlink(full).catch(() => {});
  }

  async getSignedUrl(): Promise<string> {
    throw new Error('Local storage provider does not support signed URLs. Configure S3/R2 for production.');
  }

  async exists(key: string): Promise<boolean> {
    const full = path.join(process.cwd(), '.data', 'uploads', key);
    return import('node:fs/promises').then((fs) => fs.access(full).then(() => true).catch(() => false));
  }
}

/**
 * S3-compatible storage (works with Cloudflare R2, AWS S3, or any S3-compatible
 * endpoint). Configure via STORAGE_ENDPOINT, STORAGE_BUCKET,
 * STORAGE_ACCESS_KEY_ID, STORAGE_SECRET_ACCESS_KEY, and optionally
 * STORAGE_REGION (defaults to "auto", which R2 expects). See DEPLOYMENT.md.
 */
class S3StorageProvider implements StorageProvider {
  private bucket = process.env.STORAGE_BUCKET!;
  private clientPromise = import('@aws-sdk/client-s3').then(({ S3Client }) => new S3Client({
    region: process.env.STORAGE_REGION || 'auto',
    endpoint: process.env.STORAGE_ENDPOINT,
    credentials: {
      accessKeyId: process.env.STORAGE_ACCESS_KEY_ID!,
      secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY!,
    },
  }));

  async upload(input: { bytes: Uint8Array; fileName: string; mimeType: string; ownerScope: string }): Promise<StoredObject> {
    if (!ALLOWED_MIME.has(input.mimeType)) throw new Error('Unsupported file type');
    if (input.bytes.byteLength > MAX_BYTES) throw new Error('File exceeds 10 MB limit');
    const { key } = safeKey(input.ownerScope, input.fileName);
    const [{ PutObjectCommand }, client] = await Promise.all([import('@aws-sdk/client-s3'), this.clientPromise]);
    await client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: input.bytes, ContentType: input.mimeType }));
    return { key, sizeBytes: input.bytes.byteLength, mimeType: input.mimeType };
  }

  async delete(key: string): Promise<void> {
    const [{ DeleteObjectCommand }, client] = await Promise.all([import('@aws-sdk/client-s3'), this.clientPromise]);
    await client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key })).catch(() => {});
  }

  async getSignedUrl(key: string, expiresInSeconds = 300): Promise<string> {
    const [{ GetObjectCommand }, { getSignedUrl }, client] = await Promise.all([
      import('@aws-sdk/client-s3'),
      import('@aws-sdk/s3-request-presigner'),
      this.clientPromise,
    ]);
    return getSignedUrl(client, new GetObjectCommand({ Bucket: this.bucket, Key: key }), { expiresIn: expiresInSeconds });
  }

  async exists(key: string): Promise<boolean> {
    const [{ HeadObjectCommand }, client] = await Promise.all([import('@aws-sdk/client-s3'), this.clientPromise]);
    return client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key })).then(() => true).catch(() => false);
  }
}

function isS3Configured(): boolean {
  return !!(process.env.STORAGE_ENDPOINT && process.env.STORAGE_BUCKET && process.env.STORAGE_ACCESS_KEY_ID && process.env.STORAGE_SECRET_ACCESS_KEY);
}

/**
 * Whether file uploads can actually succeed right now. Local disk writes
 * fail on Vercel's read-only filesystem outside /tmp, so without S3/R2
 * credentials configured, production uploads are guaranteed to fail. Used
 * to show an upfront warning instead of letting the user fill out the whole
 * form only to hit a storage error at the end.
 */
export function isPersistentStorageAvailable(): boolean {
  return isS3Configured() || process.env.NODE_ENV !== 'production';
}

export function getStorageProvider(): StorageProvider {
  if (isS3Configured()) return new S3StorageProvider();
  if (process.env.NODE_ENV === 'production') {
    console.warn('Storage: no S3/R2 credentials configured — falling back to ephemeral local disk in production. Uploaded files will be lost on redeploy. Set STORAGE_ENDPOINT/STORAGE_BUCKET/STORAGE_ACCESS_KEY_ID/STORAGE_SECRET_ACCESS_KEY.');
  }
  return new LocalStorageProvider();
}
