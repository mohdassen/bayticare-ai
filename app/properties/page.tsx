import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const typeLabel:Record<string,string>={VILLA:'فيلا',APARTMENT:'شقة',TOWNHOUSE:'تاون هاوس',DUPLEX:'دوبلكس',COMPOUND_UNIT:'وحدة سكنية',OTHER:'منزل'};

type Props={searchParams?:Promise<Record<string,string|string[]|undefined>>};

export default async function Properties({searchParams}:Props){
  const u=await getCurrentUser();
  if(!u)redirect('/login');
  const params=(await searchParams)||{};
  const error=typeof params.error==='string'?params.error:'';
  const ps=await prisma.property.findMany({where:{ownerId:u.id},include:{rooms:{select:{id:true,name:true},orderBy:{name:'asc'}},_count:{select:{assets:true,rooms:true}}},orderBy:{createdAt:'asc'}});
  return <AppShell>
    <div className="top"><div><div className="eyebrow">DIGITAL HOME TWIN</div><h1 className="pageTitle">منازلي</h1><p className="muted">أنشئ نسخة رقمية لكل منزل وتابع الغرف والأجهزة والصيانة من مكان واحد.</p></div></div>
    {error&&<div className="badge danger" style={{display:'block',marginBottom:16,padding:12}}>{error}</div>}

    {ps.length ? <div className="grid">{ps.map(p=><div className="card homeCard" key={p.id}>
      <div className="homeCardTop"><div><div className="homeIcon">⌂</div><h2 style={{marginTop:16,marginBottom:6}}>{p.name}</h2><p className="muted">{p.city}{p.district?' · '+p.district:''}</p></div><span className="badge">{typeLabel[p.type] ?? p.type}</span></div>
      <div className="homeMeta"><span className="pill">◫ {p._count.assets} أصول</span><span className="pill">▦ {p._count.rooms} غرف</span></div>
      <div style={{marginTop:16}}>{p.rooms.length?<div style={{display:'flex',gap:7,flexWrap:'wrap'}}>{p.rooms.map(r=><span className="pill" key={r.id}>🚪 {r.name}</span>)}</div>:<p className="muted" style={{fontSize:13}}>أضف الغرف لتحديد موقع كل جهاز داخل المنزل.</p>}</div>
      <form action="/api/rooms" method="post" style={{display:'flex',gap:8,marginTop:14,position:'relative'}}><input type="hidden" name="propertyId" value={p.id}/><input name="name" placeholder="مثال: الصالة" required style={{flex:1,padding:'10px 12px',border:'1px solid #d9e3dc',borderRadius:12,background:'#fbfdfb'}}/><button className="btn small" type="submit">+ غرفة</button></form>
    </div>)}</div> : <div className="empty" style={{marginBottom:22}}><div className="homeIcon" style={{margin:'0 auto 14px'}}>⌂</div><h2>لا يوجد منزل بعد</h2><p className="muted">أضف منزلك الأول لتبدأ بتسجيل الأجهزة والضمانات وجدولة الصيانة.</p></div>}

    <form className="card form formCard" action="/api/properties" method="post">
      <div className="sectionHead"><div><div className="eyebrow">ADD PROPERTY</div><h2 style={{marginTop:6}}>إضافة منزل جديد</h2></div><span className="badge">الخطوة 1</span></div>
      <label>اسم المنزل</label><input name="name" placeholder="مثال: منزل العائلة" required/>
      <label>نوع السكن</label><select name="type"><option value="VILLA">فيلا</option><option value="APARTMENT">شقة</option><option value="TOWNHOUSE">تاون هاوس</option><option value="DUPLEX">دوبلكس</option><option value="COMPOUND_UNIT">وحدة سكنية</option><option value="OTHER">أخرى</option></select>
      <div className="grid two" style={{margin:'0'}}><div><label>المدينة</label><input name="city" placeholder="الرياض" defaultValue="Riyadh" required/></div><div><label>الحي</label><input name="district" placeholder="مثال: النرجس"/></div></div>
      <button className="btn">حفظ المنزل والمتابعة</button>
    </form>
  </AppShell>
}
