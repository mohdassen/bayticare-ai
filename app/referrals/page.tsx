import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CopyLinkButton } from '@/components/CopyLinkButton';
import { appBaseUrl } from '@/lib/url';

export default async function ReferralsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  // Best-effort: this table needs `prisma db push` to exist in production yet.
  const referrals = await prisma.referral.findMany({ where: { referrerId: user.id }, orderBy: { createdAt: 'desc' } }).catch(() => null);

  const link = `${appBaseUrl()}/register?ref=${user.id}`;

  return <AppShell>
    <div className="top"><div><span className="eyebrow">GROW TOGETHER</span><h1 className="pageTitle">ادعُ صديق</h1><p className="muted">شارك رابطك مع صديق ليبدأ منزله الرقمي معك.</p></div></div>

    <div className="card soft">
      <div className="sectionHead"><h2>رابطك الخاص</h2></div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <code style={{ background: '#fff', border: '1px solid #dde6df', borderRadius: 12, padding: '10px 14px', fontSize: 13, direction: 'ltr', flex: 1, minWidth: 260, overflowWrap: 'anywhere' }}>{link}</code>
        <CopyLinkButton link={link} />
      </div>
      <p className="muted" style={{ marginTop: 14, fontSize: 13 }}>عند تسجيل صديقك عبر هذا الرابط، ستظهر دعوته هنا. مكافآت الدعوة (مثل شهر مجاني) ستُفعّل لاحقًا مع إطلاق نظام الاشتراكات.</p>
    </div>

    <div className="card" style={{ marginTop: 22 }}>
      <div className="sectionHead"><h2>دعواتك</h2>{referrals && <span className="badge">{referrals.length}</span>}</div>
      {referrals === null
        ? <p className="muted">ميزة تتبع الدعوات قيد الإعداد حاليًا على هذا الخادم.</p>
        : referrals.length === 0
          ? <p className="muted">لم تدعُ أحدًا بعد — شارك رابطك أعلاه.</p>
          : <div className="list">{referrals.map((r) => <div className="item" key={r.id}><span>{r.refereeEmail}</span><span className="badge">{r.refereeUserId ? '✓ سجّل' : 'بانتظار التسجيل'}</span></div>)}</div>}
    </div>
  </AppShell>;
}
