import Link from 'next/link';
const links=[['/dashboard','لوحة المنزل'],['/properties','منازلي'],['/assets','الأصول'],['/maintenance','الصيانة'],['/services','الخدمات'],['/documents','الوثائق'],['/expenses','المصروفات'],['/ai','المساعد الذكي']];
export function Sidebar(){return <aside className="sidebar"><div className="brand">Bayti<span>Care</span></div><nav className="nav">{links.map(([href,label])=><Link key={href} href={href}>{label}</Link>)}</nav></aside>}
