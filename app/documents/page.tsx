import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadDocument, deleteDocument } from './actions';

const categoryLabels: Record<string,string> = {
  INVOICE:'فاتورة', WARRANTY:'ضمان', MANUAL:'دليل', MAINTENANCE_REPORT:'تقرير صيانة', CONTRACT:'عقد', INSURANCE:'تأمين', PROPERTY_DOCUMENT:'وثيقة عقار', OTHER:'أخرى'
};

export default async function DocumentsPage(){
  const user=await getCurrentUser();
  if(!user) redirect('/login');
  const properties=await prisma.property.findMany({where:{ownerId:user.id},include:{assets:{select:{id:true,name:true}}},orderBy:{createdAt:'desc'}});
  const documents=await prisma.document.findMany({
    where:{property:{ownerId:user.id}},
    include:{property:{select:{name:true}},asset:{select:{name:true}}},
    orderBy:{createdAt:'desc'}
  });

  return <AppShell>
    <div className="top"><div><h1>خزنة الوثائق</h1><p className="muted">احفظ الفواتير والضمانات والتقارير واربطها مباشرة بمنزلك وأجهزتك.</p></div><span className="badge">{documents.length} وثيقة</span></div>

    <div className="grid" style={{gridTemplateColumns:'1fr 2fr'}}>
      <form className="card" action={uploadDocument}>
        <h2>إضافة وثيقة</h2>
        {properties.length===0 ? <p className="muted">أضف منزلًا أولًا قبل رفع الوثائق.</p> : <>
          <label>المنزل</label>
          <select name="propertyId" required>{properties.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <label>اسم الوثيقة</label><input name="name" required placeholder="مثال: فاتورة مكيف الصالة" />
          <label>التصنيف</label><select name="category" defaultValue="INVOICE">{Object.entries(categoryLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>
          <label>الأصل المرتبط (اختياري)</label><select name="assetId" defaultValue=""><option value="">بدون أصل محدد</option>{properties.flatMap(p=>p.assets.map(a=><option key={a.id} value={a.id}>{p.name} — {a.name}</option>))}</select>
          <label>تاريخ الانتهاء (اختياري)</label><input name="expiresAt" type="date" />
          <label>الملف</label><input name="file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required />
          <p className="muted">PDF أو صورة، بحد أقصى 10MB. الملفات لا تُنشر كرابط عام.</p>
          <button className="btn" type="submit">حفظ الوثيقة</button>
        </>}
      </form>

      <div className="card"><h2>الوثائق المحفوظة</h2>{documents.length===0?<p className="muted">لا توجد وثائق حتى الآن.</p>:<div className="list">{documents.map(d=><div className="item" key={d.id}><div><strong>{d.name}</strong><div className="muted">{categoryLabels[d.category]||d.category} · {d.property.name}{d.asset?` · ${d.asset.name}`:''}</div><small className="muted">{d.originalName||'ملف'}{d.sizeBytes?` · ${(d.sizeBytes/1024/1024).toFixed(2)} MB`:''}{d.expiresAt?` · ينتهي ${d.expiresAt.toLocaleDateString('ar-SA')}`:''}</small></div><form action={deleteDocument}><input type="hidden" name="id" value={d.id}/><button className="btn secondary" type="submit">حذف</button></form></div>)}</div>}</div>
    </div>
  </AppShell>;
}
