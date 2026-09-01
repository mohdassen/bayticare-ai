import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

function fail(message:string):never{redirect(`/properties?error=${encodeURIComponent(message)}`)}

export async function POST(req:Request){
  const u=await getCurrentUser();
  if(!u)redirect('/login');
  const f=await req.formData();
  const propertyId=String(f.get('propertyId')||'');
  const name=String(f.get('name')||'').trim();
  if(!name)fail('يرجى إدخال اسم الغرفة.');
  const property=await prisma.property.findFirst({where:{id:propertyId,ownerId:u.id}});
  if(!property)fail('تعذر إضافة الغرفة. تأكد من اختيار المنزل الصحيح ثم حاول مرة أخرى.');
  await prisma.room.create({data:{propertyId,name}});
  redirect('/properties');
}
