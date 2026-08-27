import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export async function POST(req:Request){
  const u=await getCurrentUser();
  if(!u)return new Response('Unauthorized',{status:401});
  const f=await req.formData();
  const propertyId=String(f.get('propertyId')||'');
  const name=String(f.get('name')||'').trim();
  if(!name)return new Response('Room name required',{status:400});
  const property=await prisma.property.findFirst({where:{id:propertyId,ownerId:u.id}});
  if(!property)return new Response('Forbidden',{status:403});
  await prisma.room.create({data:{propertyId,name}});
  redirect('/properties');
}
