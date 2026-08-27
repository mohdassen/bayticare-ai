'use client';
import { useMemo, useState } from 'react';

type Room={id:string;name:string};
type Property={id:string;name:string;rooms:Room[]};

const categories=[
  ['Air Conditioner','❄️','مكيف'],['Refrigerator','🧊','ثلاجة'],['Washer','🧺','غسالة'],['Water Heater','♨️','سخان'],
  ['Water Pump','💧','مضخة'],['Water Tank','🚰','خزان'],['Water Filter','🫗','فلتر'],['CCTV','📷','كاميرات'],['Other','⌂','أخرى']
] as const;

export function AssetWizard({properties}:{properties:Property[]}){
  const [step,setStep]=useState(1);
  const [propertyId,setPropertyId]=useState(properties[0]?.id||'');
  const [category,setCategory]=useState('Air Conditioner');
  const rooms=useMemo(()=>properties.find(p=>p.id===propertyId)?.rooms||[],[properties,propertyId]);
  if(!properties.length)return <div className="empty"><div style={{fontSize:36}}>🏠</div><h3>أضف منزلًا أولًا</h3><p className="muted">بعد إضافة المنزل يمكنك بناء سجل أجهزته وصيانته وضماناته.</p></div>;
  return <div className="card wizard">
    <div className="wizardHead"><div><span className="eyebrow">إضافة أصل جديد</span><h2>عرّف BaytiCare على جهازك</h2></div><div className="stepPills"><span className={step>=1?'on':''}>1</span><i></i><span className={step>=2?'on':''}>2</span><i></i><span className={step>=3?'on':''}>3</span></div></div>
    <form action="/api/assets" method="post">
      <input type="hidden" name="category" value={category}/>
      {step===1&&<div className="wizardStep"><h3>أين يوجد الجهاز؟</h3><p className="muted">اختر المنزل والغرفة حتى نبني النسخة الرقمية بشكل منظم.</p><label>المنزل</label><select name="propertyId" value={propertyId} onChange={e=>setPropertyId(e.target.value)} required>{properties.map(p=><option value={p.id} key={p.id}>{p.name}</option>)}</select><label>الغرفة / الموقع</label><select name="roomId" defaultValue=""><option value="">غير محدد الآن</option>{rooms.map(r=><option value={r.id} key={r.id}>{r.name}</option>)}</select><button type="button" className="btn" onClick={()=>setStep(2)}>التالي ←</button></div>}
      {step===2&&<div className="wizardStep"><h3>ما نوع الجهاز؟</h3><p className="muted">اختر الفئة الآن، ويمكننا إضافة التعرف بالصور لاحقًا كمسار AI مستقل.</p><div className="categoryGrid">{categories.map(([value,icon,label])=><button type="button" key={value} className={'categoryChoice '+(category===value?'selected':'')} onClick={()=>setCategory(value)}><b>{icon}</b><span>{label}</span></button>)}</div><div className="wizardActions"><button type="button" className="btn ghost" onClick={()=>setStep(1)}>رجوع</button><button type="button" className="btn" onClick={()=>setStep(3)}>التالي ←</button></div></div>}
      {step===3&&<div className="wizardStep"><h3>تفاصيل الجهاز والصيانة</h3><p className="muted">أدخل ما تعرفه فقط. يمكنك إكمال الناقص لاحقًا من صفحة الجهاز.</p><div className="formGrid"><div><label>اسم الجهاز</label><input name="name" placeholder="مثال: مكيف الصالة" required/></div><div><label>الشركة المصنعة</label><input name="manufacturer" placeholder="Carrier / LG / Samsung"/></div><div><label>الموديل</label><input name="model" placeholder="رقم الموديل"/></div><div><label>الرقم التسلسلي</label><input name="serialNumber" placeholder="Serial Number"/></div><div><label>تاريخ الشراء</label><input name="purchaseDate" type="date"/></div><div><label>سعر الشراء</label><input name="purchasePrice" type="number" step="0.01" placeholder="ر.س"/></div><div><label>انتهاء الضمان</label><input name="warrantyExpiresAt" type="date"/></div><div><label>دورية الصيانة</label><select name="maintenanceIntervalDays" defaultValue="180"><option value="90">كل 3 أشهر</option><option value="180">كل 6 أشهر</option><option value="365">كل سنة</option></select></div></div><div className="wizardSummary"><span>الفئة المختارة</span><strong>{categories.find(x=>x[0]===category)?.[2]}</strong></div><div className="wizardActions"><button type="button" className="btn ghost" onClick={()=>setStep(2)}>رجوع</button><button className="btn" type="submit">✓ حفظ وإنشاء خطة الصيانة</button></div></div>}
    </form>
  </div>
}
