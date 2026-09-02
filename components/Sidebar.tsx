'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const groups: { label: string; links: [string, string, string][] }[] = [
  { label: '', links: [['/dashboard', '⌂', 'لوحة المنزل']] },
  { label: 'منزلي', links: [['/properties', '⌂', 'منازلي'], ['/assets', '◫', 'الأصول'], ['/maintenance', '✓', 'الصيانة'], ['/documents', '▤', 'الوثائق والضمانات']] },
  { label: 'الخدمات والتكاليف', links: [['/services', '✦', 'الخدمات'], ['/expenses', '﷼', 'المصروفات']] },
  { label: 'أخرى', links: [['/reports', '⎙', 'التقرير الشهري'], ['/referrals', '👥', 'ادعُ صديق']] },
];

export function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');
  return <aside className="sidebar">
    <div>
      <div className="brand"><div className="brandMark">B</div>Bayti<span>Care</span></div>
      <div className="sidebarSub">Home Intelligence Platform</div>
      {groups.map((g) => <nav className="nav" key={g.label || 'main'}>
        {g.label && <div className="navGroupLabel">{g.label}</div>}
        {g.links.map(([href, icon, label]) => <Link key={href} href={href} className={isActive(href) ? 'active' : ''}><span className="navIcon">{icon}</span>{label}</Link>)}
      </nav>)}
      <nav className="nav">
        <div className="navGroupLabel">الذكاء الاصطناعي</div>
        <Link href="/ai" className={'aiLink' + (isActive('/ai') ? ' active' : '')}><span className="navIcon">✧</span>المساعد الذكي<span className="navAiBadge">AI</span></Link>
      </nav>
    </div>
    <div className="sidebarFoot">بيتك أذكى، وصيانته أسهل.<div style={{ marginTop: 8, display: 'flex', gap: 10 }}><Link href="/privacy">الخصوصية</Link><Link href="/terms">الشروط</Link></div></div>
  </aside>;
}
