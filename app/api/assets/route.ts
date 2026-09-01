import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

const text=(v:FormDataEntryValue|null)=>{const s=String(v||'').trim();return s||null};
const date=(v:FormDataEntryValue|null)=>{const s=text(v);return s?new Date(s):null};
const number=(v:FormDataEntryValue|null)=>{const s=text(v);return s?Number(s):null};
function fail(message:string):never{redirect(`/assets?error=${encodeURIComponent(message)}`)}

export async function POST(req:Request){
  const u=await getCurrentUser();
  if(!u)redirect('/login');
  const f=await req.formData();
  const propertyId=String(f.get('propertyId')||'');
  const property=await prisma.property.findFirst({where:{id:propertyId,ownerId:u.id}});
  if(!property)fail('تعذر حفظ الجهاز. تأكد من اختيار المنزل ثم حاول مرة أخرى.');
  const roomId=text(f.get('roomId'));
  if(roomId){const room=await prisma.room.findFirst({where:{id:roomId,propertyId}});if(!room)fail('الغرفة المختارة غير صحيحة. اختر غرفة تابعة لهذا المنزل.');}
  const interval=Math.max(1,Number(f.get('maintenanceIntervalDays')||180));
  const next=new Date(); next.setDate(next.getDate()+interval);
  const name=String(f.get('name')||'').trim();
  if(!name)fail('يرجى إدخال اسم الجهاز.');
  const warrantyExpiresAt=date(f.get('warrantyExpiresAt'));
  const asset=await prisma.asset.create({data:{propertyId,roomId,name,category:String(f.get('category')||'Other'),manufacturer:text(f.get('manufacturer')),model:text(f.get('model')),serialNumber:text(f.get('serialNumber')),purchaseDate:date(f.get('purchaseDate')),purchasePrice:number(f.get('purchasePrice')),warrantyExpiresAt,maintenanceIntervalDays:interval,nextMaintenanceAt:next}});
  await prisma.maintenanceEvent.create({data:{assetId:asset.id,userId:u.id,title:`صيانة ${asset.name}`,dueAt:next,status:'SCHEDULED'}});
  const params=new URLSearchParams({created:asset.name,next:next.toISOString(),warranty:warrantyExpiresAt?'1':'0'});
  redirect(`/assets?${params.toString()}`);
}
