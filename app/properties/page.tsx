import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const typeLabel:Record<string,string>={VILLA:'فيلا',APARTMENT:'شقة',TOWNHOUSE:'تاون هاوس',DUPLEX:'دوبلكس',COMPOUND_UNIT:'وحدة سكنية',OTHER:'منزل'};

export default async function Properties(){
  const u=await getCurrentUser();
  if(!u)redirect('/login');
  const ps=await prisma.property.findMany({where:{ownerId:u.id},include:{_count:{select:{assets:true,rooms:true}}},orderBy:{createdAt:'asc'}});
  return <AppShell>
    <div className="top"><div><div className="eyebrow">DIGITAL HOME TWIN</div><h1 className="pageTitle">منازلي</h1><p className="muted">أنشئ نسخة رقمية لكل منزل وتابع أجهزته وصيانته من مكان واحد.</p></div></div>

    {ps.length ? <div className="grid">{ps.map(p=><div className="card homeCard" key={p.id}>
      <div className="homeCardTop"><div><div className="homeIcon">⌂</div><h2 style={{marginTop:16,marginBottom:6}}>{p.name}</h2><p className="muted">{p.city}{p.district?' · '+p.district:''}</p></div><span className="badge">{typeLabel[p.type] ?? p.type}</span></div>
      <div className="homeMeta"><span className="pill">◫ {p._count.assets} أصول</span><span className="pill">▦ {p._count.rooms} غرف</span></div>
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
