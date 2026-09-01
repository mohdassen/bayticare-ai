import { getCurrentUser } from '@/lib/auth'; import { prisma } from '@/lib/prisma'; import { PropertyType, OwnershipType } from '@prisma/client'; import { redirect } from 'next/navigation';
const propertyTypes = new Set<string>(Object.values(PropertyType));
const ownershipTypes = new Set<string>(Object.values(OwnershipType));
function fail(message:string):never{redirect(`/properties?error=${encodeURIComponent(message)}`)}
export async function POST(req:Request){
  const u=await getCurrentUser();
  if(!u)redirect('/login');
  const f=await req.formData();
  const name=String(f.get('name')||'').trim();
  const city=String(f.get('city')||'').trim();
  const typeRaw=String(f.get('type')||'');
  const ownershipRaw=String(f.get('ownership')||'OWNED');
  const yearRaw=String(f.get('constructionYear')||'').trim();
  if(!name||!city)fail('يرجى إدخال اسم المنزل والمدينة.');
  if(!propertyTypes.has(typeRaw))fail('نوع السكن غير صحيح.');
  if(!ownershipTypes.has(ownershipRaw))fail('حالة الملكية غير صحيحة.');
  const constructionYear=yearRaw?Number(yearRaw):null;
  if(constructionYear!==null&&(!Number.isInteger(constructionYear)||constructionYear<1300||constructionYear>2100))fail('سنة البناء غير صحيحة.');
  const p=await prisma.property.create({data:{ownerId:u.id,name,type:typeRaw as PropertyType,ownership:ownershipRaw as OwnershipType,city,district:String(f.get('district')||'').trim()||null,constructionYear}});
  await prisma.floor.create({data:{propertyId:p.id,name:'الدور الأرضي'}});
  redirect('/assets?onboarding=1');
}
