'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getStorageProvider } from '@/lib/storage';

const categories = new Set(['INVOICE','WARRANTY','MANUAL','MAINTENANCE_REPORT','CONTRACT','INSURANCE','PROPERTY_DOCUMENT','OTHER']);

export async function uploadDocument(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const propertyId = String(formData.get('propertyId') || '');
  const assetIdRaw = String(formData.get('assetId') || '').trim();
  const assetId = assetIdRaw || null;
  const name = String(formData.get('name') || '').trim();
  const categoryRaw = String(formData.get('category') || 'OTHER');
  const expiresAtRaw = String(formData.get('expiresAt') || '').trim();
  const file = formData.get('file');

  if (!name || !(file instanceof File) || file.size === 0) throw new Error('Missing document data');
  if (!categories.has(categoryRaw)) throw new Error('Invalid document category');

  const property = await prisma.property.findFirst({ where: { id: propertyId, ownerId: user.id }, select: { id: true } });
  if (!property) throw new Error('Property not found');

  if (assetId) {
    const asset = await prisma.asset.findFirst({ where: { id: assetId, propertyId }, select: { id: true } });
    if (!asset) throw new Error('Asset not found');
  }

  const stored = await getStorageProvider().put({
    bytes: new Uint8Array(await file.arrayBuffer()),
    fileName: file.name,
    mimeType: file.type,
    ownerScope: user.id,
  });

  await prisma.document.create({
    data: {
      propertyId,
      assetId,
      name,
      originalName: file.name,
      category: categoryRaw as any,
      storageKey: stored.key,
      mimeType: stored.mimeType,
      sizeBytes: stored.sizeBytes,
      expiresAt: expiresAtRaw ? new Date(expiresAtRaw) : null,
    },
  });

  revalidatePath('/documents');
}

export async function deleteDocument(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const id = String(formData.get('id') || '');
  const doc = await prisma.document.findFirst({
    where: { id, property: { ownerId: user.id } },
    select: { id: true },
  });
  if (!doc) throw new Error('Document not found');
  await prisma.document.delete({ where: { id } });
  revalidatePath('/documents');
}
