import Link from 'next/link';

const links = [
  ['/dashboard','⌂','لوحة المنزل'],
  ['/properties','⌂','منازلي'],
  ['/assets','◫','الأصول'],
  ['/maintenance','✓','الصيانة'],
  ['/services','✦','الخدمات'],
  ['/documents','▤','الوثائق'],
  ['/expenses','﷼','المصروفات'],
  ['/ai','✧','المساعد الذكي'],
];

export function Sidebar(){
  return <aside className="sidebar">
    <div>
      <div className="brand"><div className="brandMark">B</div>Bayti<span>Care</span></div>
      <div className="sidebarSub">Home Intelligence Platform</div>
      <nav className="nav">{links.map(([href,icon,label])=><Link key={href} href={href}><span className="navIcon">{icon}</span>{label}</Link>)}</nav>
    </div>
    <div className="sidebarFoot">بيتك أذكى، وصيانته أسهل.<div style={{marginTop:8,display:'flex',gap:10}}><Link href="/privacy">الخصوصية</Link><Link href="/terms">الشروط</Link></div></div>
  </aside>
}
