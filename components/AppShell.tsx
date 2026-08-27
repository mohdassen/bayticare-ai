import Link from 'next/link';
import { Sidebar } from './Sidebar';

const mobileLinks = [
  ['/dashboard','⌂','الرئيسية'],
  ['/properties','⌂','منازلي'],
  ['/maintenance','✓','الصيانة'],
  ['/services','✦','الخدمات'],
  ['/ai','✧','الذكاء'],
];

export function AppShell({children}:{children:React.ReactNode}){
  return <div className="shell">
    <Sidebar/>
    <main className="main">{children}</main>
    <nav className="mobileBar">{mobileLinks.map(([href,icon,label])=><Link key={href} href={href}><b>{icon}</b><span>{label}</span></Link>)}</nav>
  </div>
}
