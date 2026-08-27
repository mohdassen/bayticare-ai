import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

const text=(v:FormDataEntryValue|null)=>{const s=String(v||'').trim();return s||null};
const date=(v:FormDataEntryValue|null)=>{const s=text(v);return s?new Date(s):null};
const number=(v:FormDataEntryValue|null)=>{const s=text(v);return s?Number(s):null};

export async function POST(req:Request){
  const u=await getCurrentUser();
  if(!u)return new Response('Unauthorized',{status:401});
  const f=await req.formData();
  const propertyId=String(f.get('propertyId')||'');
  const property=await prisma.property.findFirst({where:{id:propertyId,ownerId:u.id}});
  if(!property)return new Response('Forbidden',{status:403});
  const roomId=text(f.get('roomId'));
  if(roomId){const room=await prisma.room.findFirst({where:{id:roomId,propertyId}});if(!room)return new Response('Invalid room',{status:400});}
  const interval=Math.max(1,Number(f.get('maintenanceIntervalDays')||180));
  const next=new Date(); next.setDate(next.getDate()+interval);
  const name=String(f.get('name')||'').trim();
  if(!name)return new Response('Name required',{status:400});
  const asset=await prisma.asset.create({data:{propertyId,roomId,name,category:String(f.get('category')||'Other'),manufacturer:text(f.get('manufacturer')),model:text(f.get('model')),serialNumber:text(f.get('serialNumber')),purchaseDate:date(f.get('purchaseDate')),purchasePrice:number(f.get('purchasePrice')),warrantyExpiresAt:date(f.get('warrantyExpiresAt')),maintenanceIntervalDays:interval,nextMaintenanceAt:next}});
  await prisma.maintenanceEvent.create({data:{assetId:asset.id,userId:u.id,title:`صيانة ${asset.name}`,dueAt:next,status:'SCHEDULED'}});
  redirect('/assets');
}
