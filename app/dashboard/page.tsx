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
    orderBy: { createdAt: 'asc' },
  });

  const assets = property?.assets ?? [];
  const maintenance = assets.flatMap((a) => a.maintenance);
  const health = calculateHomeHealth(assets, maintenance);
  const now = new Date();
  const overdue = maintenance.filter((m) => !m.completedAt && m.dueAt < now);
  const soon = maintenance.filter((m) => !m.completedAt && m.dueAt >= now).sort((a,b)=>a.dueAt.getTime()-b.dueAt.getTime()).slice(0,5);
  const activeWarranties = assets.filter((a) => a.warrantyExpiresAt && a.warrantyExpiresAt > now).length;
  const monthSpend = maintenance.filter((m)=>m.completedAt && m.cost && m.completedAt.getMonth()===now.getMonth() && m.completedAt.getFullYear()===now.getFullYear()).reduce((sum,m)=>sum+(m.cost ?? 0),0);

  return <AppShell>
    <div className="top">
      <div><div className="eyebrow">BAYTICARE HOME</div><h1 className="pageTitle">أهلًا {u.name.split(' ')[0]} 👋</h1><p className="muted">هذه نظرة سريعة على حالة منزلك وما يحتاج انتباهك اليوم.</p></div>
      <Link className="btn" href="/assets">+ إضافة أصل</Link>
    </div>

    {!property ? <div className="empty"><h2>ابدأ بإضافة منزلك</h2><p className="muted">أنشئ النسخة الرقمية الأولى لمنزلك ثم أضف الأجهزة والأصول.</p><Link className="btn" href="/properties">إضافة منزل</Link></div> : <>
      <div className="card soft">
        <div className="sectionHead"><div><span className="eyebrow">{property.city}{property.district ? ` · ${property.district}`:''}</span><h2 style={{marginTop:6}}>{property.name}</h2></div><span className="badge">متصل</span></div>
        <div className="healthWrap">
          <div className="health" style={{'--score': health.score} as React.CSSProperties}><strong>{health.score}</strong><small>/100</small></div>
          <div className="healthText"><h3>{health.score >= 85 ? 'حالة المنزل ممتازة' : health.score >= 70 ? 'حالة المنزل جيدة' : 'المنزل يحتاج بعض الاهتمام'}</h3><p>{overdue.length ? `لديك ${overdue.length} أعمال صيانة متأخرة. إنهاؤها سيرفع صحة المنزل.` : 'لا توجد أعمال صيانة متأخرة الآن. استمر بهذا المستوى.'}</p></div>
        </div>
      </div>

      <div className="grid">
        <div className="card kpi"><div className="kpiIcon">◫</div><div className="metric">{assets.length}</div><div className="metricLabel">أصل وجهاز مسجل</div></div>
        <div className="card kpi"><div className="kpiIcon">✓</div><div className="metric">{overdue.length}</div><div className="metricLabel">صيانة متأخرة</div></div>
        <div className="card kpi"><div className="kpiIcon">⌁</div><div className="metric">{activeWarranties}</div><div className="metricLabel">ضمانات فعالة</div></div>
        <div className="card kpi"><div className="kpiIcon">﷼</div><div className="metric">{monthSpend.toLocaleString('ar-SA')}</div><div className="metricLabel">مصروفات هذا الشهر</div></div>
      </div>

      <div className="quickActions">
        <Link className="quick" href="/assets"><span>◫</span><small>إضافة جهاز</small></Link>
        <Link className="quick" href="/maintenance"><span>✓</span><small>جدول الصيانة</small></Link>
        <Link className="quick" href="/documents"><span>▤</span><small>حفظ وثيقة</small></Link>
        <Link className="quick" href="/services"><span>✦</span><small>طلب خدمة</small></Link>
      </div>

      <div className="grid two">
        <div className="card">
          <div className="sectionHead"><h2>يحتاج انتباهك</h2><Link className="badge" href="/maintenance">عرض الكل</Link></div>
          {overdue.length || soon.length ? <div className="list">
            {overdue.slice(0,3).map((m)=><div className="item" key={m.id}><div className="itemMain"><div className="itemIcon">!</div><div><strong>{m.title}</strong><div className="muted" style={{fontSize:12}}>متأخرة منذ {m.dueAt.toLocaleDateString('ar-SA')}</div></div></div><span className="badge danger">متأخرة</span></div>)}
            {soon.slice(0,3).map((m)=><div className="item" key={m.id}><div className="itemMain"><div className="itemIcon">✓</div><div><strong>{m.title}</strong><div className="muted" style={{fontSize:12}}>موعدها {m.dueAt.toLocaleDateString('ar-SA')}</div></div></div><span className="badge">قادمة</span></div>)}
          </div> : <div className="empty"><strong>كل شيء تحت السيطرة</strong><p className="muted" style={{marginBottom:0}}>لا توجد مهام عاجلة الآن.</p></div>}
        </div>

        <div className="card">
          <div className="sectionHead"><h2>نصيحة BaytiCare</h2><span className="badge">AI</span></div>
          <p className="muted" style={{lineHeight:1.9}}>{assets.length === 0 ? 'ابدأ بإضافة المكيفات، مضخة المياه والثلاجة. هذه الأصول تعطيك قيمة فورية من التذكيرات والضمانات.' : overdue.length ? 'ابدأ بأقدم مهمة صيانة متأخرة. إغلاق المهام المتأخرة أولًا يحسن صحة المنزل ويقلل احتمالية الأعطال المفاجئة.' : 'أضف فواتير وضمانات أجهزتك المهمة حتى يستطيع BaytiCare تنبيهك قبل انتهاء الضمان.'}</p>
          <Link className="btn secondary" href="/ai">اسأل المساعد الذكي</Link>
        </div>
      </div>
    </>}
  </AppShell>;
}
