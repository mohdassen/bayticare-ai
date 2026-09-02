import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const statusLabel: Record<string, string> = { NEW: 'جديد', HEALTHY: 'سليم', MAINTENANCE_DUE: 'يحتاج صيانة', OVERDUE: 'متأخر', REPAIR_REQUIRED: 'يحتاج إصلاح', REPLACEMENT_RECOMMENDED: 'يُنصح بالاستبدال', RETIRED: 'متوقف' };
const categoryIcon = (category: string) => category === 'Air Conditioner' ? '❄️' : category === 'Refrigerator' ? '🧊' : category === 'Washer' ? '🧺' : category === 'Water Pump' ? '💧' : category === 'Water Tank' ? '🚰' : category === 'CCTV' ? '📷' : '⌂';

export default async function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const { id } = await params;

  const asset = await prisma.asset.findFirst({
    where: { id, property: { ownerId: user.id } },
    include: {
      property: { select: { id: true, name: true } },
      room: { select: { name: true } },
      maintenance: { orderBy: { dueAt: 'desc' } },
      documents: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!asset) notFound();

  const now = new Date();
  const completedMaintenance = asset.maintenance.filter((m) => m.completedAt);
  const lifetimeCost = completedMaintenance.reduce((s, m) => s + (m.cost || 0), 0);
  const trackedOwnershipCost = (asset.purchasePrice || 0) + lifetimeCost;
  const sar = (v: number) => new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(v);
  const warrantyActive = asset.warrantyExpiresAt && asset.warrantyExpiresAt > now;

  return <AppShell>
    <div className="top">
      <div><Link href="/assets" className="badge">← رجوع للأصول</Link><h1 className="pageTitle" style={{ marginTop: 10 }}>{categoryIcon(asset.category)} {asset.name}</h1><p className="muted">{asset.property.name}{asset.room ? ` · ${asset.room.name}` : ''}</p></div>
      <Link href={`/assets/${asset.id}/label`} className="btn secondary">🏷️ ملصق QR</Link>
    </div>

    <div className="grid two">
      <div className="card">
        <div className="sectionHead"><h2>بيانات الجهاز</h2><span className="badge">{statusLabel[asset.status] || asset.status}</span></div>
        <div className="list">
          <div className="item"><span>الفئة</span><strong>{asset.category}</strong></div>
          <div className="item"><span>الشركة المصنّعة</span><strong>{asset.manufacturer || '—'}</strong></div>
          <div className="item"><span>الموديل</span><strong>{asset.model || '—'}</strong></div>
          <div className="item"><span>الرقم التسلسلي</span><strong style={{ direction: 'ltr' }}>{asset.serialNumber || '—'}</strong></div>
          <div className="item"><span>تاريخ الشراء</span><strong>{asset.purchaseDate ? asset.purchaseDate.toLocaleDateString('ar-SA') : '—'}</strong></div>
          <div className="item"><span>سعر الشراء</span><strong>{asset.purchasePrice ? sar(asset.purchasePrice) : '—'}</strong></div>
          <div className="item"><span>الضمان</span><strong>{asset.warrantyExpiresAt ? `${warrantyActive ? 'فعال حتى' : 'انتهى في'} ${asset.warrantyExpiresAt.toLocaleDateString('ar-SA')}` : 'غير مسجل'}</strong></div>
        </div>
      </div>

      <div className="card">
        <div className="sectionHead"><h2>تكلفة الملكية المتتبعة</h2></div>
        <div className="statGrid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div className="card soft" style={{ textAlign: 'center', padding: 14 }}><div className="metric" style={{ fontSize: 24 }}>{sar(lifetimeCost)}</div><div className="metricLabel">إجمالي الصيانة</div></div>
          <div className="card soft" style={{ textAlign: 'center', padding: 14 }}><div className="metric" style={{ fontSize: 24 }}>{sar(trackedOwnershipCost)}</div><div className="metricLabel">التكلفة الكلية</div></div>
        </div>
        <div className="list">
          <div className="item"><span>عدد عمليات الصيانة</span><strong>{completedMaintenance.length}</strong></div>
          <div className="item"><span>آخر صيانة</span><strong>{asset.lastMaintenanceAt ? asset.lastMaintenanceAt.toLocaleDateString('ar-SA') : '—'}</strong></div>
          <div className="item"><span>الصيانة القادمة</span><strong>{asset.nextMaintenanceAt ? asset.nextMaintenanceAt.toLocaleDateString('ar-SA') : '—'}</strong></div>
          <div className="item"><span>دورية الصيانة</span><strong>{asset.maintenanceIntervalDays ? `كل ${asset.maintenanceIntervalDays} يوم` : 'غير محددة'}</strong></div>
        </div>
      </div>
    </div>

    <div className="card" style={{ marginTop: 22 }}>
      <div className="sectionHead"><h2>سجل الصيانة</h2><Link href="/maintenance" className="badge">مركز الصيانة</Link></div>
      {asset.maintenance.length === 0 ? <p className="muted">لا يوجد سجل صيانة بعد.</p> : <div className="list">{asset.maintenance.map((m) => <div className="item" key={m.id}><div><strong>{m.title}</strong><div className="muted" style={{ fontSize: 12 }}>{m.completedAt ? `اكتملت ${m.completedAt.toLocaleDateString('ar-SA')}` : `موعدها ${m.dueAt.toLocaleDateString('ar-SA')}`}</div></div><span className={m.completedAt ? 'badge' : m.dueAt < now ? 'badge danger' : 'badge'}>{m.completedAt ? (m.cost ? sar(m.cost) : 'مكتملة') : m.dueAt < now ? 'متأخرة' : 'قادمة'}</span></div>)}</div>}
    </div>

    <div className="card" style={{ marginTop: 22 }}>
      <div className="sectionHead"><h2>الوثائق المرتبطة</h2><Link href={`/documents?asset=${asset.id}`} className="badge">خزنة الوثائق</Link></div>
      {asset.documents.length === 0 ? <p className="muted">لا توجد وثائق مرتبطة بهذا الجهاز بعد.</p> : <div className="list">{asset.documents.map((d) => <div className="item" key={d.id}><span>{d.name}</span><span className="badge">{d.category}</span></div>)}</div>}
    </div>
  </AppShell>;
}
