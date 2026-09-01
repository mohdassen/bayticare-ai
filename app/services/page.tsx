import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createBooking, cancelBooking } from './actions';

const labels: Record<string,string> = {
  AC:'تكييف', PLUMBING:'سباكة', ELECTRICAL:'كهرباء', APPLIANCE_REPAIR:'صيانة أجهزة', WATER_TANK:'خزانات مياه', PEST_CONTROL:'مكافحة حشرات', CLEANING:'تنظيف', WATER_FILTER:'فلاتر مياه', CCTV:'كاميرات', SMART_HOME:'منزل ذكي', ELEVATOR:'مصاعد', GARAGE_DOOR:'باب كراج', OTHER:'أخرى'
};
const statusLabels: Record<string,string> = {REQUESTED:'مطلوب',CONFIRMED:'مؤكد',TECHNICIAN_ASSIGNED:'تم تعيين الفني',ON_THE_WAY:'في الطريق',ARRIVED:'وصل',IN_PROGRESS:'قيد التنفيذ',COMPLETED:'مكتمل',CANCELLED:'ملغي',DISPUTED:'نزاع'};

type Props={searchParams?:Promise<Record<string,string|string[]|undefined>>};

export default async function ServicesPage({searchParams}:Props){
  const user=await getCurrentUser();
  if(!user) redirect('/login');
  const params=(await searchParams)||{};
  const error=typeof params.error==='string'?params.error:'';
  const [properties,providers,bookings]=await Promise.all([
    prisma.property.findMany({where:{ownerId:user.id},include:{assets:{select:{id:true,name:true}}},orderBy:{createdAt:'desc'}}),
    prisma.provider.findMany({where:{status:'VERIFIED'},orderBy:[{rating:'desc'},{name:'asc'}]}),
    prisma.booking.findMany({where:{userId:user.id},include:{property:{select:{name:true}},asset:{select:{name:true}},provider:{select:{name:true}},history:{orderBy:{createdAt:'asc'}}},orderBy:{createdAt:'desc'}})
  ]);
  return <AppShell>
    <div className="top"><div><h1>الخدمات والحجوزات</h1><p className="muted">اطلب خدمة مرتبطة بمنزلك أو أحد أجهزتك وتابع حالتها من البداية حتى الإغلاق.</p></div><span className="badge">{bookings.filter(b=>!['COMPLETED','CANCELLED'].includes(b.status)).length} طلب نشط</span></div>
    {error&&<div className="badge danger" style={{display:'block',marginBottom:16,padding:12}}>{error}</div>}
    <div className="grid" style={{gridTemplateColumns:'1fr 2fr'}}>
      <form className="card" action={createBooking}>
        <h2>طلب خدمة</h2>
        {properties.length===0?<p className="muted">أضف منزلًا أولًا قبل طلب خدمة.</p>:<>
          <label>المنزل</label><select name="propertyId" required>{properties.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <label>نوع الخدمة</label><select name="category" defaultValue="AC">{Object.entries(labels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>
          <label>الأصل المرتبط (اختياري)</label><select name="assetId" defaultValue=""><option value="">بدون أصل محدد</option>{properties.flatMap(p=>p.assets.map(a=><option key={a.id} value={a.id}>{p.name} — {a.name}</option>))}</select>
          <label>مزود الخدمة</label><select name="providerId" defaultValue=""><option value="">اختر لاحقًا / أقرب مزود</option>{providers.map(p=><option key={p.id} value={p.id}>{p.name} · ⭐ {p.rating.toFixed(1)}</option>)}</select>
          <label>الموعد المفضل</label><input name="scheduledAt" type="datetime-local" />
          <label>وصف المشكلة</label><textarea name="notes" rows={4} placeholder="مثال: المكيف يسرّب ماء منذ يومين" />
          <button className="btn" type="submit">إرسال الطلب</button>
        </>}
      </form>
      <div className="card"><h2>طلباتي</h2>{bookings.length===0?<p className="muted">لا توجد طلبات خدمة حتى الآن.</p>:<div className="list">{bookings.map(b=><div className="item" key={b.id}><div><strong>{labels[b.category]||b.category}</strong><div className="muted">{b.property.name}{b.asset?` · ${b.asset.name}`:''}{b.provider?` · ${b.provider.name}`:' · بانتظار اختيار مزود'}</div><small className="muted">{b.scheduledAt?`الموعد: ${b.scheduledAt.toLocaleString('ar-SA')}`:'الموعد غير محدد'} · آخر حالة: {statusLabels[b.status]||b.status}</small>{b.history.length>0&&<div style={{marginTop:6}}><span className="badge">{b.history.length} تحديثات للحالة</span></div>}</div><div>{!['COMPLETED','CANCELLED'].includes(b.status)&&<form action={cancelBooking}><input type="hidden" name="id" value={b.id}/><button className="btn secondary" type="submit">إلغاء</button></form>}</div></div>)}</div>}</div>
    </div>
  </AppShell>;
}
