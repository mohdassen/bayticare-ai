'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

const serviceCategories = new Set(['AC','PLUMBING','ELECTRICAL','APPLIANCE_REPAIR','WATER_TANK','PEST_CONTROL','CLEANING','WATER_FILTER','CCTV','SMART_HOME','ELEVATOR','GARAGE_DOOR','OTHER']);

function fail(message: string): never {
  redirect(`/services?error=${encodeURIComponent(message)}`);
}

export async function createBooking(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const propertyId = String(formData.get('propertyId') || '');
  const assetId = String(formData.get('assetId') || '').trim() || null;
  const providerId = String(formData.get('providerId') || '').trim() || null;
  const category = String(formData.get('category') || '');
  const scheduledAt = String(formData.get('scheduledAt') || '').trim();
  const notes = String(formData.get('notes') || '').trim();
  if (!serviceCategories.has(category)) fail('نوع الخدمة غير صحيح.');

  const property = await prisma.property.findFirst({ where: { id: propertyId, ownerId: user.id }, select: { id: true } });
  if (!property) fail('تعذر إرسال الطلب. تأكد من اختيار المنزل الصحيح ثم حاول مرة أخرى.');
  if (assetId) {
    const asset = await prisma.asset.findFirst({ where: { id: assetId, propertyId }, select: { id: true } });
    if (!asset) fail('الأصل المحدد غير موجود في هذا المنزل.');
  }
  if (providerId) {
    const provider = await prisma.provider.findFirst({ where: { id: providerId, status: 'VERIFIED' }, select: { id: true } });
    if (!provider) fail('مزود الخدمة غير متاح حاليًا.');
  }

  await prisma.booking.create({
    data: {
      userId: user.id, propertyId, assetId, providerId, category,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      notes: notes || null,
      history: { create: { status: 'REQUESTED', note: 'تم إنشاء طلب الخدمة من العميل' } }
    }
  });
  revalidatePath('/services');
}

export async function cancelBooking(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const id = String(formData.get('id') || '');
  const booking = await prisma.booking.findFirst({ where: { id, userId: user.id }, select: { id: true, status: true } });
  if (!booking) fail('تعذر العثور على الطلب.');
  if (['COMPLETED','CANCELLED'].includes(booking.status)) fail('لا يمكن إلغاء هذا الطلب في حالته الحالية.');
  await prisma.$transaction([
    prisma.booking.update({ where: { id }, data: { status: 'CANCELLED' } }),
    prisma.bookingStatusHistory.create({ data: { bookingId: id, status: 'CANCELLED', note: 'ألغى العميل الطلب' } })
  ]);
  revalidatePath('/services');
}
