import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateHomeHealth } from '@/lib/health';
import { PrintButton } from '@/components/PrintButton';

const typeLabel: Record<string, string> = { VILLA: 'فيلا', APARTMENT: 'شقة', TOWNHOUSE: 'تاون هاوس', DUPLEX: 'دوبلكس', COMPOUND_UNIT: 'وحدة سكنية', OTHER: 'منزل' };

export default async function PassportPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const { id } = await params;

  const property = await prisma.property.findFirst({
    where: { id, ownerId: user.id },
    include: {
      rooms: { select: { name: true } },
      assets: { include: { maintenance: true, room: { select: { name: true } } }, orderBy: { createdAt: 'asc' } },
      documents: { select: { assetId: true, category: true } },
    },
  });
  if (!property) notFound();

  const assets = property.assets;
  const maintenance = assets.flatMap((a) => a.maintenance);
  const assetIdsWithDocs = new Set(property.documents.map((d) => d.assetId).filter((v): v is string => !!v));
  const health = calculateHomeHealth(assets, maintenance, assetIdsWithDocs);
  const now = new Date();
  const totalMaintenanceCost = maintenance.filter((m) => m.completedAt).reduce((s, m) => s + (m.cost || 0), 0);
  const purchaseValue = assets.reduce((s, a) => s + (a.purchasePrice || 0), 0);
  const sar = (v: number) => new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(v);

  return <main className="passport">
    <style>{`
      .passport{max-width:900px;margin:0 auto;padding:40px 24px;background:#fff;color:#14251c;font-family:var(--font-tajawal),Arial,sans-serif}
      .passportHead{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #0f6a48;padding-bottom:20px;margin-bottom:24px}
      .passportBrand{font-size:22px;font-weight:900;color:#0f6a48}
      .passportBrand span{color:#174d39}
      .passportMeta{text-align:left;font-size:12px;color:#6f7d75}
      .passportScore{display:flex;align-items:center;gap:20px;background:#eef6f1;border-radius:18px;padding:20px;margin-bottom:28px}
      .passportScoreRing{width:90px;height:90px;border-radius:50%;background:conic-gradient(#0f6a48 calc(${health.score}*1%),#e6ece8 0);display:grid;place-items:center;flex:0 0 auto;position:relative}
      .passportScoreRing:after{content:"";width:68px;height:68px;background:#eef6f1;border-radius:50%;position:absolute}
      .passportScoreRing strong{z-index:1;font-size:24px}
      .passportSection{margin-bottom:26px}
      .passportSection h2{font-size:16px;border-bottom:1px solid #dde6df;padding-bottom:8px;margin-bottom:12px;color:#174d39}
      table{width:100%;border-collapse:collapse;font-size:13px}
      th{text-align:right;color:#6f7d75;font-weight:700;padding:8px 6px;border-bottom:2px solid #dde6df}
      td{padding:8px 6px;border-bottom:1px solid #edf1ee}
      .statGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:26px}
      .statBox{background:#fbfdfb;border:1px solid #dde6df;border-radius:14px;padding:14px;text-align:center}
      .statBox strong{display:block;font-size:20px;color:#0f6a48}
      .passportFoot{margin-top:30px;padding-top:16px;border-top:1px solid #dde6df;font-size:11px;color:#6f7d75;line-height:1.8}
      @media print{.no-print{display:none}body{padding:0}}
      @media(max-width:640px){.passportHead{flex-direction:column;gap:10px}.statGrid{grid-template-columns:1fr 1fr}table{font-size:11px}}
    `}</style>

    <div className="no-print" style={{ marginBottom: 16, display: 'flex', gap: 10 }}>
      <PrintButton label="🖨️ طباعة / حفظ PDF" />
    </div>

    <div className="passportHead">
      <div><div className="passportBrand">Bayti<span>Care</span> — جواز سفر المنزل</div><div className="muted" style={{ fontSize: 13, marginTop: 4 }}>سجل رقمي موثّق لأجهزة وصيانة وضمانات المنزل</div></div>
      <div className="passportMeta">تاريخ الإصدار: {now.toLocaleDateString('ar-SA')}<br />صادر عبر bayticare-ai.vercel.app</div>
    </div>

    <div className="passportSection">
      <h2>بيانات المنزل</h2>
      <table><tbody>
        <tr><td style={{ color: '#6f7d75', width: 140 }}>الاسم</td><td><strong>{property.name}</strong></td></tr>
        <tr><td style={{ color: '#6f7d75' }}>النوع</td><td>{typeLabel[property.type] || property.type}</td></tr>
        <tr><td style={{ color: '#6f7d75' }}>المدينة</td><td>{property.city}{property.district ? ` · ${property.district}` : ''}</td></tr>
        {property.constructionYear && <tr><td style={{ color: '#6f7d75' }}>سنة البناء</td><td>{property.constructionYear}</td></tr>}
        <tr><td style={{ color: '#6f7d75' }}>عدد الغرف</td><td>{property.rooms.length}</td></tr>
      </tbody></table>
    </div>

    <div className="passportScore">
      <div className="passportScoreRing"><strong>{health.score}</strong></div>
      <div><h3 style={{ margin: '0 0 4px' }}>{health.status}</h3><p className="muted" style={{ margin: 0, fontSize: 13 }}>مؤشر صحة منزل حتمي (غير معتمد على تخمين ذكاء اصطناعي) — مبني على حالة الصيانة والضمانات الفعلية.</p></div>
    </div>

    <div className="statGrid">
      <div className="statBox"><strong>{assets.length}</strong><small>أصل مسجل</small></div>
      <div className="statBox"><strong>{sar(purchaseValue)}</strong><small>قيمة الشراء الإجمالية</small></div>
      <div className="statBox"><strong>{sar(totalMaintenanceCost)}</strong><small>إجمالي تكلفة الصيانة</small></div>
    </div>

    <div className="passportSection">
      <h2>سجل الأجهزة والأصول</h2>
      {assets.length === 0 ? <p className="muted">لا توجد أصول مسجلة بعد.</p> : <table>
        <thead><tr><th>الجهاز</th><th>الموقع</th><th>الشركة/الموديل</th><th>الضمان</th><th>آخر صيانة</th><th>الصيانة القادمة</th></tr></thead>
        <tbody>{assets.map((a) => <tr key={a.id}>
          <td><strong>{a.name}</strong></td>
          <td>{a.room?.name || '—'}</td>
          <td>{[a.manufacturer, a.model].filter(Boolean).join(' / ') || '—'}</td>
          <td>{a.warrantyExpiresAt ? (a.warrantyExpiresAt > now ? `فعال حتى ${a.warrantyExpiresAt.toLocaleDateString('ar-SA')}` : 'منتهٍ') : 'غير مسجل'}</td>
          <td>{a.lastMaintenanceAt ? a.lastMaintenanceAt.toLocaleDateString('ar-SA') : '—'}</td>
          <td>{a.nextMaintenanceAt ? a.nextMaintenanceAt.toLocaleDateString('ar-SA') : '—'}</td>
        </tr>)}</tbody>
      </table>}
    </div>

    <div className="passportFoot">
      هذا التقرير تم إنشاؤه تلقائيًا من بيانات مسجّلة داخل BaytiCare AI بواسطة مالك الحساب. البيانات المعروضة (الضمانات، تواريخ الصيانة) مبنية على ما أدخله المستخدم أو استخرجه النظام من المستندات المرفوعة، وقد تحتوي على أخطاء — يُنصح بالتحقق من الوثائق الأصلية عند الحاجة لتأكيد رسمي (مثل عملية بيع العقار).
    </div>
  </main>;
}
