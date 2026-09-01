import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { AssetWizard } from '@/components/AssetWizard';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Props={searchParams?:Promise<Record<string,string|string[]|undefined>>};

export default async function Assets({searchParams}:Props){
  const u=await getCurrentUser();
  if(!u)redirect('/login');
  const params=(await searchParams)||{};
  const error=typeof params.error==='string'?params.error:'';
  const created=typeof params.created==='string'?params.created:'';
  const nextRaw=typeof params.next==='string'?params.next:'';
  const hasWarranty=params.warranty==='1';
  const onboarding=params.onboarding==='1';
  const ps=await prisma.property.findMany({where:{ownerId:u.id},include:{rooms:{select:{id:true,name:true}},assets:{select:{id:true,name:true,category:true,manufacturer:true,model:true,status:true,nextMaintenanceAt:true,warrantyExpiresAt:true,room:{select:{name:true}}}}},orderBy:{createdAt:'desc'}});
  const assets=ps.flatMap(p=>p.assets.map(a=>({...a,propertyName:p.name})));
  const icon=(category:string)=>category==='Air Conditioner'?'❄️':category==='Refrigerator'?'🧊':category==='Washer'?'🧺':category==='Water Pump'?'💧':category==='Water Tank'?'🚰':category==='CCTV'?'📷':'⌂';
  return <AppShell>
    <div className="top"><div><span className="eyebrow">Digital Home Twin</span><h1 className="pageTitle">أجهزة وأصول المنزل</h1><p className="muted">كل جهاز يصبح له سجل صيانة وضمان وتكلفة داخل منزلك الرقمي.</p></div><span className="badge">{assets.length} أصل مسجل</span></div>
    {error&&<div className="badge danger" style={{display:'block',marginBottom:16,padding:12}}>{error}</div>}
    {created&&<div className="card soft" style={{marginBottom:16}}>
      <h3 style={{margin:0}}>✓ تمت إضافة {created} بنجاح</h3>
      <p className="muted" style={{margin:'6px 0'}}>{nextRaw?`الصيانة القادمة: ${new Date(nextRaw).toLocaleDateString('ar-SA')}`:''} · {hasWarranty?'الضمان مسجل':'الضمان غير مسجل'}</p>
      <a className="btn secondary small" href="/documents">📷 صوّر الفاتورة</a>
    </div>}
    {onboarding&&!assets.length&&<div className="card soft" style={{marginBottom:16}}><h3 style={{margin:0}}>أضف أول جهاز في منزلك</h3><p className="muted" style={{margin:'6px 0 0'}}>ابدأ بمكيف، ثلاجة، غسالة، سخان، مضخة أو خزان مياه — صوّره أو أضفه يدويًا خلال دقيقة.</p></div>}
    <AssetWizard properties={ps.map(p=>({id:p.id,name:p.name,rooms:p.rooms}))}/>
    <div className="sectionHead" style={{marginTop:30}}><div><h2>أصولك</h2><p className="muted" style={{margin:4}}>تابع الحالة والصيانة القادمة لكل جهاز.</p></div></div>
    {assets.length?<div className="assetGrid">{assets.map(a=><div className="card assetCard" key={a.id}><div className="assetCardTop"><div className="assetIcon">{icon(a.category)}</div><div><span className="badge">{a.propertyName}</span>{a.room&&<span className="pill" style={{marginRight:6}}>{a.room.name}</span>}</div></div><div><h3>{a.name}</h3><p className="muted">{[a.manufacturer,a.model].filter(Boolean).join(' · ')||'يمكن إضافة الموديل لاحقًا'}</p></div><div className="assetFacts"><div><small>الصيانة القادمة</small><strong>{a.nextMaintenanceAt?a.nextMaintenanceAt.toLocaleDateString('ar-SA'):'غير محددة'}</strong></div><div><small>الضمان</small><strong>{a.warrantyExpiresAt&&a.warrantyExpiresAt>new Date()?'فعال':'غير مسجل'}</strong></div></div></div>)}</div>:<div className="empty"><div style={{fontSize:42}}>📦</div><h3>ابدأ بأول جهاز</h3><p className="muted">أضف مكيفًا أو ثلاجة أو مضخة، وسيبني BaytiCare أول خطة صيانة تلقائيًا.</p></div>}
  </AppShell>
}
