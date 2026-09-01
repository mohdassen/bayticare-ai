'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getStorageProvider } from '@/lib/storage';
import { DocumentCategory } from '@prisma/client';

const categories = new Set<string>(Object.values(DocumentCategory));

function fail(message: string): never {
  redirect(`/documents?error=${encodeURIComponent(message)}`);
}

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

  if (!name || !(file instanceof File) || file.size === 0) fail('يرجى اختيار ملف وإدخال اسم الوثيقة.');
  if (!categories.has(categoryRaw)) fail('تصنيف الوثيقة غير صحيح.');

  const property = await prisma.property.findFirst({ where: { id: propertyId, ownerId: user.id }, select: { id: true } });
  if (!property) fail('تعذر حفظ الوثيقة. تأكد من اختيار المنزل الصحيح ثم حاول مرة أخرى.');

  if (assetId) {
    const asset = await prisma.asset.findFirst({ where: { id: assetId, propertyId }, select: { id: true } });
    if (!asset) fail('الأصل المحدد غير موجود في هذا المنزل.');
  }

  let stored;
  try {
    stored = await getStorageProvider().put({
      bytes: new Uint8Array(await file.arrayBuffer()),
      fileName: file.name,
      mimeType: file.type,
      ownerScope: user.id,
    });
  } catch (error) {
    console.error('document storage failed', error);
    fail('تعذر رفع الملف. تأكد أن الصيغة والحجم مدعومان (JPG, PNG, WEBP, PDF بحد أقصى 10MB).');
  }

  await prisma.document.create({
    data: {
      propertyId,
      assetId,
      name,
      originalName: file.name,
      category: categoryRaw as DocumentCategory,
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
  if (!doc) fail('تعذر العثور على الوثيقة.');
  await prisma.document.delete({ where: { id } });
  revalidatePath('/documents');
}
