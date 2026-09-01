'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function QuickCapture() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  function go(href: string) {
    setOpen(false);
    router.push(href);
  }
  return <div className="quickFabWrap">
    {open && <div className="quickMenu">
      <small>مسح ذكي فوري — صوّر وسنملأ البيانات لك</small>
      <button type="button" onClick={() => go('/assets?quickstart=1')}>📷 جهاز جديد</button>
      <button type="button" onClick={() => go('/documents?quickstart=1')}>🧾 فاتورة أو ضمان</button>
    </div>}
    <button type="button" className="quickFab" onClick={() => setOpen((o) => !o)} aria-label="مسح ذكي">{open ? '×' : '✧'}</button>
  </div>;
}
