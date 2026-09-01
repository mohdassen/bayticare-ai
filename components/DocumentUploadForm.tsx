'use client';
import { useRef, useState } from 'react';

type Asset={id:string;name:string};
type Property={id:string;name:string;assets:Asset[]};
type Scan={merchant?:string;invoiceNumber?:string;purchaseDate?:string;product?:string;model?:string;serialNumber?:string;price?:number;vat?:number;warrantyMonths?:number;confidence:number;mode?:string;verifiedByZatca?:boolean};
const styles=`.docAI label{display:block;font-size:13px;font-weight:800;color:#405248;margin:6px 0}.docAI>select,.docAI>input{width:100%;padding:13px 14px;border:1px solid #d9e3dc;border-radius:14px;background:#fbfdfb;margin:0 0 14px}.docAI .scanDrop{position:relative;display:grid;place-items:center;text-align:center;border:1.5px dashed #9dc5ae;border-radius:20px;padding:24px;background:#f5fbf7;cursor:pointer;margin:14px 0 18px}.docAI .scanDrop input{position:absolute;inset:0;opacity:0;cursor:pointer}.docAI .scanIcon{font-size:34px}.docAI .scanDrop strong{color:#164f3b;margin-top:6px}.docAI .scanDrop small{color:#77857d;margin-top:4px}.docAI .scanNotice{padding:11px 13px;border-radius:12px;margin:8px 0}.docAI .scanNotice.error{background:#fff0f0;color:#a73636}.docAI .scanResult{padding:13px 15px;border-radius:15px;background:#edf7f1;margin-bottom:16px}.docAI .scanResult>div{display:flex;align-items:center;gap:9px;margin-bottom:6px}.docAI .scanResult p{margin:0;color:#52655b;font-size:13px}`;

export function DocumentUploadForm({properties,action,autoFocus}:{properties:Property[];action:(formData:FormData)=>void|Promise<void>;autoFocus?:boolean}){
  const [scan,setScan]=useState<Scan|null>(null);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  const [name,setName]=useState('');const [category,setCategory]=useState('INVOICE');const [expiresAt,setExpiresAt]=useState('');
  const dropRef=useRef<HTMLLabelElement>(null);
  async function analyze(file?:File){if(!file)return;setBusy(true);setError('');setScan(null);try{const fd=new FormData();fd.set('file',file);const res=await fetch('/api/ai/scan-document',{method:'POST',body:fd});const data=await res.json();if(!res.ok)throw new Error(data.error||'تعذر التحليل');setScan(data);if(data.product)setName(data.product);if(data.warrantyMonths&&data.purchaseDate){const d=new Date(data.purchaseDate);d.setMonth(d.getMonth()+Number(data.warrantyMonths));setExpiresAt(d.toISOString().slice(0,10));}}catch(e){setError(e instanceof Error?e.message:'تعذر التحليل');}finally{setBusy(false)}}
  if(!properties.length)return <p className="muted">أضف منزلًا أولًا قبل رفع الوثائق.</p>;
  return <><style>{styles}</style><form className="card docAI" action={action}>
    <div className="sectionHead"><div><span className="eyebrow">AI DOCUMENT SCAN</span><h2>إضافة فاتورة أو ضمان</h2></div><span className="badge">AI Ready</span></div>
    <label ref={dropRef} className="scanDrop" style={autoFocus?{borderColor:'#0f6a48',boxShadow:'0 0 0 4px rgba(15,106,72,.12)'}:undefined}><input name="file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required onChange={e=>{const f=e.target.files?.[0];if(f&&f.type!=='application/pdf')analyze(f)}}/><span className="scanIcon">🧾</span><strong>{busy?'جاري قراءة الوثيقة...':autoFocus?'ابدأ هنا — صوّر الفاتورة الآن':'صوّر الفاتورة أو ارفعها'}</strong><small>التحليل الذكي للصور، وPDF يُحفظ في الخزنة</small></label>
    {error&&<div className="scanNotice error">{error}</div>}
    {scan&&<div className="scanResult"><div><span className="badge">{scan.mode&&scan.mode!=='mock'?'AI Extracted':'وضع تجريبي'}</span>{scan.verifiedByZatca&&<span className="badge" style={{background:'#e6f4ea',color:'#0f6a48'}}>✓ تم التحقق عبر فاتورة إلكترونية (ZATCA)</span>}<strong>{Math.round((scan.confidence||0)*100)}%</strong></div><p>{scan.mode&&scan.mode!=='mock'?`${scan.merchant||'وثيقة'}${scan.invoiceNumber?` · #${scan.invoiceNumber}`:''}${scan.price?` · ${scan.price} ر.س`:''}`:'واجهة الاستخراج جاهزة، لكن مفتاح AI غير مفعّل.'}</p></div>}
    <label>المنزل</label><select name="propertyId" required>{properties.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
    <label>اسم الوثيقة</label><input name="name" value={name} onChange={e=>setName(e.target.value)} required placeholder="مثال: فاتورة مكيف الصالة"/>
    <label>التصنيف</label><select name="category" value={category} onChange={e=>setCategory(e.target.value)}><option value="INVOICE">فاتورة</option><option value="WARRANTY">ضمان</option><option value="MANUAL">دليل</option><option value="MAINTENANCE_REPORT">تقرير صيانة</option><option value="CONTRACT">عقد</option><option value="INSURANCE">تأمين</option><option value="PROPERTY_DOCUMENT">وثيقة عقار</option><option value="OTHER">أخرى</option></select>
    <label>الأصل المرتبط</label><select name="assetId" defaultValue=""><option value="">بدون أصل محدد</option>{properties.flatMap(p=>p.assets.map(a=><option key={a.id} value={a.id}>{p.name} — {a.name}</option>))}</select>
    <label>تاريخ الانتهاء</label><input name="expiresAt" type="date" value={expiresAt} onChange={e=>setExpiresAt(e.target.value)}/>
    {scan?.purchaseDate&&<p className="muted">تاريخ الشراء المقروء: {scan.purchaseDate}{scan.warrantyMonths?` · ضمان ${scan.warrantyMonths} شهر`:''}</p>}
    <button className="btn" type="submit">حفظ في خزنة الوثائق</button>
  </form></>
}
