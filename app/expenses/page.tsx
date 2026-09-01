import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function ExpensesPage(){
  const user=await getCurrentUser();
  if(!user) redirect('/login');
  const events=await prisma.maintenanceEvent.findMany({
    where:{asset:{property:{ownerId:user.id}},cost:{not:null}},
    include:{asset:{select:{name:true,category:true,property:{select:{name:true}}}}},
    orderBy:{completedAt:'desc'}
  });
  const now=new Date();
  const currentYear=now.getFullYear();
  const currentMonth=now.getMonth();
  const total=events.reduce((s,e)=>s+(e.cost||0),0);
  const year=events.filter(e=>(e.completedAt||e.updatedAt).getFullYear()===currentYear).reduce((s,e)=>s+(e.cost||0),0);
  const month=events.filter(e=>{const d=e.completedAt||e.updatedAt;return d.getFullYear()===currentYear&&d.getMonth()===currentMonth}).reduce((s,e)=>s+(e.cost||0),0);
  const byCategory=Object.entries(events.reduce<Record<string,number>>((acc,e)=>{acc[e.asset.category]=(acc[e.asset.category]||0)+(e.cost||0);return acc},{})).sort((a,b)=>b[1]-a[1]);
  const byAsset=Object.entries(events.reduce<Record<string,number>>((acc,e)=>{acc[e.asset.name]=(acc[e.asset.name]||0)+(e.cost||0);return acc},{})).sort((a,b)=>b[1]-a[1]);
  const sar=(v:number)=>new Intl.NumberFormat('ar-SA',{style:'currency',currency:'SAR',maximumFractionDigits:0}).format(v);

  const allAssets=await prisma.asset.findMany({where:{property:{ownerId:user.id}},select:{id:true,name:true,purchasePrice:true}});
  const maintByAsset=events.reduce<Record<string,number>>((acc,e)=>{acc[e.assetId]=(acc[e.assetId]||0)+(e.cost||0);return acc},{});
  const ownership=allAssets.filter(a=>a.purchasePrice||maintByAsset[a.id]).map(a=>({name:a.name,purchase:a.purchasePrice||0,maintenance:maintByAsset[a.id]||0,total:(a.purchasePrice||0)+(maintByAsset[a.id]||0)})).sort((a,b)=>b.total-a.total);

  return <AppShell>
    <div className="top"><div><h1>مصروفات المنزل</h1><p className="muted">تكلفة الصيانة الفعلية المسجلة على أصول منازلك.</p></div></div>
    <div className="grid">
      <div className="card"><div className="muted">هذا الشهر</div><div className="metric">{sar(month)}</div></div>
      <div className="card"><div className="muted">هذه السنة</div><div className="metric">{sar(year)}</div></div>
      <div className="card"><div className="muted">إجمالي تاريخ الصيانة</div><div className="metric">{sar(total)}</div></div>
      <div className="card"><div className="muted">عمليات مدفوعة</div><div className="metric">{events.length}</div></div>
    </div>
    <div className="grid" style={{gridTemplateColumns:'1fr 1fr'}}>
      <div className="card"><h2>الأعلى حسب الفئة</h2>{byCategory.length===0?<p className="muted">سجّل تكلفة عند إكمال أعمال الصيانة لتظهر التحليلات هنا.</p>:<div className="list">{byCategory.map(([k,v])=><div className="item" key={k}><span>{k}</span><strong>{sar(v)}</strong></div>)}</div>}</div>
      <div className="card"><h2>الأعلى حسب الأصل</h2>{byAsset.length===0?<p className="muted">لا توجد تكاليف مسجلة.</p>:<div className="list">{byAsset.slice(0,8).map(([k,v])=><div className="item" key={k}><span>{k}</span><strong>{sar(v)}</strong></div>)}</div>}</div>
    </div>
    {ownership.length>0&&<div className="card"><h2>تكلفة الملكية المتتبعة</h2><p className="muted" style={{marginTop:4}}>سعر الشراء + إجمالي الصيانة لكل أصل.</p><div className="list">{ownership.map(o=><div className="item" key={o.name}><span>{o.name}</span><span className="muted" style={{fontSize:12}}>{sar(o.purchase)} شراء + {sar(o.maintenance)} صيانة</span><strong>{sar(o.total)}</strong></div>)}</div></div>}
    <div className="card"><h2>سجل المصروفات</h2>{events.length===0?<p className="muted">لا توجد مصروفات بعد.</p>:<div className="list">{events.map(e=><div className="item" key={e.id}><div><strong>{e.title}</strong><div className="muted">{e.asset.property.name} · {e.asset.name}</div><small className="muted">{(e.completedAt||e.updatedAt).toLocaleDateString('ar-SA')}</small></div><strong>{sar(e.cost||0)}</strong></div>)}</div>}</div>
  </AppShell>;
}
