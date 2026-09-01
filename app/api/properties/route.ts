import { getCurrentUser } from '@/lib/auth'; import { prisma } from '@/lib/prisma'; import { PropertyType } from '@prisma/client'; import { redirect } from 'next/navigation';
const propertyTypes = new Set<string>(Object.values(PropertyType));
function fail(message:string):never{redirect(`/properties?error=${encodeURIComponent(message)}`)}
export async function POST(req:Request){
  const u=await getCurrentUser();
  if(!u)redirect('/login');
  const f=await req.formData();
  const name=String(f.get('name')||'').trim();
  const city=String(f.get('city')||'').trim();
  const typeRaw=String(f.get('type')||'');
  if(!name||!city)fail('يرجى إدخال اسم المنزل والمدينة.');
  if(!propertyTypes.has(typeRaw))fail('نوع السكن غير صحيح.');
  const p=await prisma.property.create({data:{ownerId:u.id,name,type:typeRaw as PropertyType,ownership:'OWNED',city,district:String(f.get('district')||'').trim()||null}});
  await prisma.floor.create({data:{propertyId:p.id,name:'الدور الأرضي'}});
  redirect('/properties');
}
