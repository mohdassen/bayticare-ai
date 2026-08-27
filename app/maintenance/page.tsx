import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { completeMaintenance } from './actions';

export default async function Maintenance(){
  const u=await getCurrentUser(); if(!u)redirect('/login');
  const rows=await prisma.maintenanceEvent.findMany({where:{asset:{property:{ownerId:u.id}}},include:{asset:{include:{property:{select:{name:true}}}}},orderBy:{dueAt:'asc'}});
  const open=rows.filter(r=>!r.completedAt); const done=rows.filter(r=>r.completedAt).slice(-6).reverse();
  const overdue=open.filter(r=>r.dueAt<new Date()).length;
  const upcoming=open.filter(r=>r.dueAt>=new Date()).length;
  return <AppShell>
    <div className="top"><div><span className="eyebrow">Preventive Maintenance</span><h1 className="pageTitle">مركز الصيانة</h1><p className="muted">اعرف ما الذي يحتاج انتباهك قبل أن يتحول إلى عطل.</p></div><span className={overdue?'badge danger':'badge'}>{overdue?`${overdue} متأخرة`:'كل شيء تحت السيطرة'}</span></div>
    <div className="grid"><div className="card kpi"><div className="kpiIcon">🛠️</div><div className="metric">{open.length}</div><div className="metricLabel">مهام مفتوحة</div></div><div className="card kpi"><div className="kpiIcon">⏰</div><div className="metric">{upcoming}</div><div className="metricLabel">قادمة</div></div><div className="card kpi"><div className="kpiIcon">⚠️</div><div className="metric">{overdue}</div><div className="metricLabel">متأخرة</div></div><div className="card kpi"><div className="kpiIcon">✅</div><div className="metric">{done.length}</div><div className="metricLabel">مكتملة مؤخرًا</div></div></div>
    <div className="grid two">
      <div className="card"><div className="sectionHead"><h2>الخطة القادمة</h2><span className="badge">{open.length}</span></div>{open.length?<div className="list">{open.map(m=>{const late=m.dueAt<new Date();return <div className="maintenanceItem" key={m.id}><div className="itemMain"><div className="itemIcon">{late?'⚠️':'🛠️'}</div><div><strong>{m.title}</strong><div className="muted">{m.asset.property.name} · {m.asset.name}</div><small className="muted">{late?'متأخرة منذ':'موعدها'} {m.dueAt.toLocaleDateString('ar-SA')}</small></div></div><form action={completeMaintenance} className="completeForm"><input type="hidden" name="id" value={m.id}/><input name="cost" type="number" step="0.01" placeholder="التكلفة ر.س"/><button className="btn small" type="submit">تمت الصيانة</button></form></div>})}</div>:<div className="empty"><div style={{fontSize:34}}>✨</div><h3>لا توجد مهام مفتوحة</h3><p className="muted">سنظهر هنا أي صيانة قادمة تلقائيًا.</p></div>}</div>
      <div className="card soft"><div className="sectionHead"><h2>آخر الأعمال المكتملة</h2></div>{done.length?<div className="list">{done.map(m=><div className="item" key={m.id}><div className="itemMain"><div className="itemIcon">✓</div><div><strong>{m.asset.name}</strong><div className="muted">{m.completedAt?.toLocaleDateString('ar-SA')}</div></div></div><span className="badge">{m.cost?`${m.cost.toLocaleString('ar-SA')} ر.س`:'مكتملة'}</span></div>)}</div>:<p className="muted">بعد إكمال أول صيانة سيظهر سجلها هنا.</p>}</div>
    </div>
  </AppShell>
}
