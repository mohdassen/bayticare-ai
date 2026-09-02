import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { getCurrentUser } from '@/lib/auth';
import { buildHomeReport } from '@/lib/report';
import { isEmailConfigured } from '@/lib/email';
import { sendReportNow } from './actions';

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function ReportsPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const params = (await searchParams) || {};
  const error = typeof params.error === 'string' ? params.error : '';
  const sent = params.sent === '1';

  const report = await buildHomeReport(user.id);
  const emailReady = isEmailConfigured();

  return <AppShell>
    <div className="top"><div><span className="eyebrow">MONTHLY REPORT</span><h1 className="pageTitle">تقرير صحة المنزل</h1><p className="muted">ملخص دوري لحالة منزلك، ويُرسل تلقائيًا كل شهر عبر البريد.</p></div></div>
    {error && <div className="badge danger" style={{ display: 'block', marginBottom: 16, padding: 12 }}>{error}</div>}
    {sent && <div className="badge" style={{ display: 'block', marginBottom: 16, padding: 12 }}>✓ تم إرسال التقرير إلى بريدك.</div>}

    {!report ? <div className="empty"><h2>أضف منزلك أولًا</h2><p className="muted">بعد إضافة منزلك سيظهر تقريرك هنا.</p><Link className="btn" href="/properties">إضافة منزل</Link></div> : <>
      <div className="card soft">
        <div className="sectionHead"><h2>{report.propertyName}</h2></div>
        <div className="healthWrap">
          <div className="health" style={{ '--score': report.health.score } as React.CSSProperties}><strong>{report.health.score}</strong><small>/100</small></div>
          <div className="healthText"><h3>{report.health.status}</h3><p>تقرير مبني على بيانات فعلية — الصيانة، الضمانات، والمصروفات.</p></div>
        </div>
        {report.health.reasons.length > 0 && report.health.reasons[0].cta && <div className="list" style={{ marginTop: 14 }}>{report.health.reasons.map((r, i) => <div className="item" key={i}><span>{r.text}</span>{r.cta && r.href && <Link className="btn secondary small" href={r.href}>{r.cta}</Link>}</div>)}</div>}
      </div>

      <div className="grid">
        <div className="card kpi"><div className="kpiIcon">◫</div><div className="metric">{report.assetsCount}</div><div className="metricLabel">أصل وجهاز مسجل</div></div>
        <div className="card kpi"><div className="kpiIcon">✓</div><div className="metric">{report.overdueCount}</div><div className="metricLabel">صيانة متأخرة</div></div>
        <div className="card kpi"><div className="kpiIcon">⌁</div><div className="metric">{report.activeWarranties}</div><div className="metricLabel">ضمانات فعالة</div></div>
        <div className="card kpi"><div className="kpiIcon">﷼</div><div className="metric">{report.monthSpend.toLocaleString('ar-SA')}</div><div className="metricLabel">مصروفات هذا الشهر</div></div>
      </div>

      <div className="card">
        <div className="sectionHead"><h2>الإرسال التلقائي</h2><span className="badge">{emailReady ? 'مفعّل' : 'غير مفعّل'}</span></div>
        <p className="muted">{emailReady ? 'سيصلك هذا التقرير تلقائيًا على بريدك في بداية كل شهر.' : 'إرسال البريد غير مفعّل بعد على هذا الخادم — راجع فريق التطوير.'}</p>
        {emailReady && <form action={sendReportNow}><button className="btn secondary" type="submit">📧 أرسل هذا التقرير إلى بريدي الآن</button></form>}
      </div>
    </>}
  </AppShell>;
}
