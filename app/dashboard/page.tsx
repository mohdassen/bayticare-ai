import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateHomeHealth } from '@/lib/health';

export default async function Dashboard() {
  const u = await getCurrentUser();
  if (!u) redirect('/login');

  const property = await prisma.property.findFirst({
    where: { ownerId: u.id },
    include: { assets: { include: { maintenance: true } } },
  });

  const assets = property?.assets ?? [];
  const maintenance = assets.flatMap((a) => a.maintenance);
  const health = calculateHomeHealth(assets, maintenance);
  const overdue = maintenance.filter((m) => !m.completedAt && m.dueAt < new Date()).length;
  const soon = maintenance.filter((m) => !m.completedAt && m.dueAt >= new Date()).slice(0, 5);

  return <AppShell>
    <div className="top">
      <div><h1>مرحبًا، {u.name}</h1><p className="muted">هذه حالة منزلك اليوم.</p></div>
      <Link className="btn" href="/properties">+ إضافة منزل</Link>
    </div>
    <div className="grid">
      <div className="card"><div className="health" style={{'--score': health.score} as React.CSSProperties}><strong>{health.score}</strong></div><p className="muted">صحة المنزل</p></div>
      <div className="card"><div className="metric">{assets.length}</div><p className="muted">الأصول المسجلة</p></div>
      <div className="card"><div className="metric">{overdue}</div><p className="muted">صيانة متأخرة</p></div>
      <div className="card"><div className="metric">{assets.filter((a) => a.warrantyExpiresAt && a.warrantyExpiresAt > new Date()).length}</div><p className="muted">ضمانات فعالة</p></div>
    </div>
    <div className="card"><h2>يحتاج انتباهك</h2>{soon.length ? <div className="list">{soon.map((m) => <div className="item" key={m.id}><span>{m.title}</span><span className="badge">{m.dueAt.toLocaleDateString('ar-SA')}</span></div>)}</div> : <p className="muted">لا توجد أعمال عاجلة الآن.</p>}</div>
  </AppShell>;
}
