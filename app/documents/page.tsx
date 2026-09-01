import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { DocumentUploadForm } from '@/components/DocumentUploadForm';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadDocument, deleteDocument } from './actions';
import { DocumentCategory } from '@prisma/client';

const categoryLabels: Record<string,string> = {
  INVOICE:'فاتورة', WARRANTY:'ضمان', MANUAL:'دليل', MAINTENANCE_REPORT:'تقرير صيانة', CONTRACT:'عقد', INSURANCE:'تأمين', PROPERTY_DOCUMENT:'وثيقة عقار', OTHER:'أخرى'
};

type Props={searchParams?:Promise<Record<string,string|string[]|undefined>>};

export default async function DocumentsPage({searchParams}:Props){
  const user=await getCurrentUser();
  if(!user) redirect('/login');
  const params=(await searchParams)||{};
  const error=typeof params.error==='string'?params.error:'';
  const fProperty=typeof params.property==='string'?params.property:'';
  const fAsset=typeof params.asset==='string'?params.asset:'';
  const fCategory=typeof params.category==='string'?params.category:'';
  const properties=await prisma.property.findMany({where:{ownerId:user.id},include:{assets:{select:{id:true,name:true}}},orderBy:{createdAt:'desc'}});
  const allAssets=properties.flatMap(p=>p.assets.map(a=>({...a,propertyId:p.id})));
  const documents=await prisma.document.findMany({
    where:{property:{ownerId:user.id},...(fProperty?{propertyId:fProperty}:{}),...(fAsset?{assetId:fAsset}:{}),...(fCategory?{category:fCategory as DocumentCategory}:{})},
    include:{property:{select:{name:true}},asset:{select:{name:true}}},
    orderBy:{createdAt:'desc'}
  });

  return <AppShell>
    <div className="top"><div><span className="eyebrow">HOME DOCUMENT VAULT</span><h1 className="pageTitle">خزنة الوثائق</h1><p className="muted">صوّر الفاتورة أو الضمان، راجع ما قرأه الذكاء الاصطناعي، ثم احفظ الأصل في سجل منزلك.</p></div><span className="badge">{documents.length} وثيقة</span></div>
    {error&&<div className="badge danger" style={{display:'block',marginBottom:16,padding:12}}>{error}</div>}

    <div className="grid" style={{gridTemplateColumns:'1fr 1.6fr'}}>
      <DocumentUploadForm properties={properties} action={uploadDocument}/>
      <div className="card">
        <div className="sectionHead"><h2>الوثائق المحفوظة</h2><span className="badge">Encrypted-ready</span></div>
        <form method="get" style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
          <select name="property" defaultValue={fProperty} style={{padding:'8px 10px',border:'1px solid #d9e3dc',borderRadius:10}}><option value="">كل المنازل</option>{properties.map(p=><option value={p.id} key={p.id}>{p.name}</option>)}</select>
          <select name="asset" defaultValue={fAsset} style={{padding:'8px 10px',border:'1px solid #d9e3dc',borderRadius:10}}><option value="">كل الأصول</option>{allAssets.map(a=><option value={a.id} key={a.id}>{a.name}</option>)}</select>
          <select name="category" defaultValue={fCategory} style={{padding:'8px 10px',border:'1px solid #d9e3dc',borderRadius:10}}><option value="">كل التصنيفات</option>{Object.entries(categoryLabels).map(([v,l])=><option value={v} key={v}>{l}</option>)}</select>
          <button className="btn secondary small" type="submit">تصفية</button>
          {(fProperty||fAsset||fCategory)&&<a className="btn ghost small" href="/documents">مسح</a>}
        </form>
        {documents.length===0?<div className="empty"><div style={{fontSize:34}}>🗂️</div><h3>{fProperty||fAsset||fCategory?'لا توجد وثائق مطابقة':'خزنتك فارغة'}</h3><p className="muted">{fProperty||fAsset||fCategory?'جرّب تصفية مختلفة أو امسح الفلاتر.':'ارفع أول فاتورة أو ضمان ليصبح مرتبطًا بتاريخ المنزل والجهاز.'}</p></div>:<div className="list">{documents.map(d=><div className="item" key={d.id}><div className="itemMain"><div className="itemIcon">{d.category==='INVOICE'?'🧾':d.category==='WARRANTY'?'🛡️':'📄'}</div><div><strong>{d.name}</strong><div className="muted">{categoryLabels[d.category]||d.category} · {d.property.name}{d.asset?` · ${d.asset.name}`:''}</div><small className="muted">{d.originalName||'ملف'}{d.sizeBytes?` · ${(d.sizeBytes/1024/1024).toFixed(2)} MB`:''}{d.expiresAt?` · ينتهي ${d.expiresAt.toLocaleDateString('ar-SA')}`:''}</small></div></div><form action={deleteDocument}><input type="hidden" name="id" value={d.id}/><button className="btn secondary small" type="submit">حذف</button></form></div>)}</div>}
      </div>
    </div>
  </AppShell>;
}
