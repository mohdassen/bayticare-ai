import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { DocumentUploadForm } from '@/components/DocumentUploadForm';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadDocument, deleteDocument } from './actions';

const categoryLabels: Record<string,string> = {
  INVOICE:'فاتورة', WARRANTY:'ضمان', MANUAL:'دليل', MAINTENANCE_REPORT:'تقرير صيانة', CONTRACT:'عقد', INSURANCE:'تأمين', PROPERTY_DOCUMENT:'وثيقة عقار', OTHER:'أخرى'
};

type Props={searchParams?:Promise<Record<string,string|string[]|undefined>>};

export default async function DocumentsPage({searchParams}:Props){
  const user=await getCurrentUser();
  if(!user) redirect('/login');
  const params=(await searchParams)||{};
  const error=typeof params.error==='string'?params.error:'';
  const properties=await prisma.property.findMany({where:{ownerId:user.id},include:{assets:{select:{id:true,name:true}}},orderBy:{createdAt:'desc'}});
  const documents=await prisma.document.findMany({
    where:{property:{ownerId:user.id}},
    include:{property:{select:{name:true}},asset:{select:{name:true}}},
    orderBy:{createdAt:'desc'}
  });

  return <AppShell>
    <div className="top"><div><span className="eyebrow">HOME DOCUMENT VAULT</span><h1 className="pageTitle">خزنة الوثائق</h1><p className="muted">صوّر الفاتورة أو الضمان، راجع ما قرأه الذكاء الاصطناعي، ثم احفظ الأصل في سجل منزلك.</p></div><span className="badge">{documents.length} وثيقة</span></div>
    {error&&<div className="badge danger" style={{display:'block',marginBottom:16,padding:12}}>{error}</div>}

    <div className="grid" style={{gridTemplateColumns:'1fr 1.6fr'}}>
      <DocumentUploadForm properties={properties} action={uploadDocument}/>
      <div className="card"><div className="sectionHead"><h2>الوثائق المحفوظة</h2><span className="badge">Encrypted-ready</span></div>{documents.length===0?<div className="empty"><div style={{fontSize:34}}>🗂️</div><h3>خزنتك فارغة</h3><p className="muted">ارفع أول فاتورة أو ضمان ليصبح مرتبطًا بتاريخ المنزل والجهاز.</p></div>:<div className="list">{documents.map(d=><div className="item" key={d.id}><div className="itemMain"><div className="itemIcon">{d.category==='INVOICE'?'🧾':d.category==='WARRANTY'?'🛡️':'📄'}</div><div><strong>{d.name}</strong><div className="muted">{categoryLabels[d.category]||d.category} · {d.property.name}{d.asset?` · ${d.asset.name}`:''}</div><small className="muted">{d.originalName||'ملف'}{d.sizeBytes?` · ${(d.sizeBytes/1024/1024).toFixed(2)} MB`:''}{d.expiresAt?` · ينتهي ${d.expiresAt.toLocaleDateString('ar-SA')}`:''}</small></div></div><form action={deleteDocument}><input type="hidden" name="id" value={d.id}/><button className="btn secondary small" type="submit">حذف</button></form></div>)}</div>}</div>
    </div>
  </AppShell>;
}
