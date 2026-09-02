import { prisma } from './prisma';
import { calculateHomeHealth, HealthBreakdown } from './health';

export type HomeReport = {
  propertyId: string;
  propertyName: string;
  health: HealthBreakdown;
  assetsCount: number;
  overdueCount: number;
  activeWarranties: number;
  monthSpend: number;
};

export async function buildHomeReport(userId: string): Promise<HomeReport | null> {
  const property = await prisma.property.findFirst({
    where: { ownerId: userId },
    include: { assets: { include: { maintenance: true } }, documents: { select: { assetId: true } } },
    orderBy: { createdAt: 'asc' },
  });
  if (!property) return null;

  const assets = property.assets;
  const maintenance = assets.flatMap((a) => a.maintenance);
  const assetIdsWithDocs = new Set(property.documents.map((d) => d.assetId).filter((v): v is string => !!v));
  const health = calculateHomeHealth(assets, maintenance, assetIdsWithDocs);
  const now = new Date();
  const overdueCount = maintenance.filter((m) => !m.completedAt && m.dueAt < now).length;
  const activeWarranties = assets.filter((a) => a.warrantyExpiresAt && a.warrantyExpiresAt > now).length;
  const monthSpend = maintenance
    .filter((m) => m.completedAt && m.cost && m.completedAt.getMonth() === now.getMonth() && m.completedAt.getFullYear() === now.getFullYear())
    .reduce((sum, m) => sum + (m.cost ?? 0), 0);

  return { propertyId: property.id, propertyName: property.name, health, assetsCount: assets.length, overdueCount, activeWarranties, monthSpend };
}

export function renderReportHtml(userName: string, report: HomeReport): string {
  const reasonsHtml = report.health.reasons.map((r) => `<li style="margin-bottom:6px">${r.text}</li>`).join('');
  return `<!DOCTYPE html><html lang="ar" dir="rtl"><body style="font-family:Arial,sans-serif;background:#f2f6f2;padding:24px;margin:0">
    <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;border:1px solid #dde6df">
      <div style="font-weight:900;color:#0f6a48;font-size:18px;margin-bottom:4px">BaytiCare AI</div>
      <p style="color:#6f7d75;font-size:13px;margin-top:0">تقرير صحة منزلك الشهري</p>
      <h2 style="margin:18px 0 4px">أهلًا ${userName.split(' ')[0]} 👋</h2>
      <p style="color:#33473d">إليك حالة "${report.propertyName}" هذا الشهر:</p>
      <div style="background:#eef6f1;border-radius:14px;padding:18px;text-align:center;margin:18px 0">
        <div style="font-size:38px;font-weight:900;color:#0f6a48">${report.health.score}<span style="font-size:16px;color:#6f7d75">/100</span></div>
        <div style="font-weight:800;margin-top:4px">${report.health.status}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:18px">
        <tr><td style="padding:6px 0;color:#6f7d75">الأصول المسجلة</td><td style="text-align:left;font-weight:800">${report.assetsCount}</td></tr>
        <tr><td style="padding:6px 0;color:#6f7d75">صيانة متأخرة</td><td style="text-align:left;font-weight:800">${report.overdueCount}</td></tr>
        <tr><td style="padding:6px 0;color:#6f7d75">ضمانات فعالة</td><td style="text-align:left;font-weight:800">${report.activeWarranties}</td></tr>
        <tr><td style="padding:6px 0;color:#6f7d75">مصروفات هذا الشهر</td><td style="text-align:left;font-weight:800">${report.monthSpend.toLocaleString('ar-SA')} ر.س</td></tr>
      </table>
      ${reasonsHtml ? `<div style="margin-bottom:18px"><strong style="font-size:13px">يحتاج انتباهك:</strong><ul style="padding-right:18px;font-size:13px;color:#33473d">${reasonsHtml}</ul></div>` : ''}
      <a href="https://bayticare-ai.vercel.app/dashboard" style="display:inline-block;background:#0f6a48;color:#fff;text-decoration:none;padding:12px 20px;border-radius:12px;font-weight:800">افتح لوحة منزلك ←</a>
      <p style="color:#9fb0a6;font-size:11px;margin-top:22px">تصلك هذه الرسالة لأنك مشترك في BaytiCare AI. لإدارة تفضيلاتك راجع إعدادات الحساب.</p>
    </div>
  </body></html>`;
}
