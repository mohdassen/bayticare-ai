import { Asset, MaintenanceEvent } from '@prisma/client';

export type HealthReason = { text: string; cta?: string; href?: string };
export type HealthBreakdown = { score: number; status: string; reasons: HealthReason[] };

const DAY = 24 * 60 * 60 * 1000;
const statusFor = (score: number) => score >= 90 ? 'ممتاز' : score >= 75 ? 'جيد' : score >= 60 ? 'يحتاج متابعة' : 'يحتاج تدخل';

export function calculateHomeHealth(assets: Asset[], maintenance: MaintenanceEvent[], assetIdsWithDocs: Set<string> = new Set(), now = new Date()): HealthBreakdown {
  if (!assets.length) return { score: 50, status: statusFor(50), reasons: [{ text: 'أضف أصولك لتحصل على تقييم دقيق لمنزلك.' }] };

  const byId = new Map(assets.map((a) => [a.id, a]));
  const overdue = maintenance.filter((m) => !m.completedAt && m.dueAt < now);
  const dueSoon = maintenance.filter((m) => !m.completedAt && m.dueAt >= now && m.dueAt.getTime() - now.getTime() <= 14 * DAY);
  const repairRequired = assets.filter((a) => a.status === 'REPAIR_REQUIRED');
  const noSchedule = assets.filter((a) => !a.maintenanceIntervalDays);
  const expiredWarranty = assets.filter((a) => a.warrantyExpiresAt && a.warrantyExpiresAt < now);
  const expiringWarranty = assets.filter((a) => a.warrantyExpiresAt && a.warrantyExpiresAt >= now && a.warrantyExpiresAt.getTime() - now.getTime() <= 30 * DAY);
  const missingDocs = assets.filter((a) => !assetIdsWithDocs.has(a.id));

  const deductions = {
    overdue: Math.min(30, overdue.length * 8),
    repair: Math.min(30, repairRequired.length * 10),
    noSchedule: Math.min(15, noSchedule.length * 3),
    expiredWarranty: Math.min(10, expiredWarranty.length * 2),
    missingDocs: Math.min(10, missingDocs.length * 1),
  };
  const score = Math.max(0, 100 - Object.values(deductions).reduce((a, b) => a + b, 0));

  const reasons: HealthReason[] = [];
  for (const m of overdue.slice(0, 2)) {
    reasons.push({ text: `${byId.get(m.assetId)?.name || 'جهاز'} يحتاج صيانة متأخرة`, cta: 'سجّل الصيانة', href: '/maintenance' });
  }
  for (const m of dueSoon.slice(0, 2)) {
    const days = Math.max(1, Math.round((m.dueAt.getTime() - now.getTime()) / DAY));
    reasons.push({ text: `${byId.get(m.assetId)?.name || 'جهاز'} يحتاج صيانة خلال ${days} يومًا`, cta: 'سجّل الصيانة', href: '/maintenance' });
  }
  for (const a of expiringWarranty.slice(0, 2)) {
    const days = Math.max(1, Math.round((a.warrantyExpiresAt!.getTime() - now.getTime()) / DAY));
    reasons.push({ text: `ضمان ${a.name} ينتهي خلال ${days} يومًا`, cta: 'راجع الضمان', href: '/documents' });
  }
  if (!reasons.length) reasons.push({ text: 'لا توجد مهام عاجلة الآن. استمر بهذا المستوى.' });

  return { score, status: statusFor(score), reasons: reasons.slice(0, 4) };
}
