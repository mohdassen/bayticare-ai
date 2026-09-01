'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { QuickCapture } from './QuickCapture';

const mobileLinks: [string, string, string][] = [
  ['/dashboard', '⌂', 'الرئيسية'],
  ['/assets', '◫', 'الأصول'],
  ['/maintenance', '✓', 'الصيانة'],
  ['/documents', '▤', 'الوثائق'],
  ['/ai', '✧', 'الذكاء'],
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');
  return <div className="shell">
    <Sidebar />
    <main className="main">{children}</main>
    <QuickCapture />
    <nav className="mobileBar">{mobileLinks.map(([href, icon, label]) => <Link key={href} href={href} style={isActive(href) ? { color: 'var(--brand)' } : undefined}><b>{icon}</b><span>{label}</span></Link>)}</nav>
  </div>;
}
