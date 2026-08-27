'use server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function completeMaintenance(formData:FormData){
  const u=await getCurrentUser(); if(!u) return;
  const id=String(formData.get('id')||'');
  const costRaw=String(formData.get('cost')||'').trim();
  const row=await prisma.maintenanceEvent.findFirst({where:{id,asset:{property:{ownerId:u.id}}},include:{asset:true}});
  if(!row)return;
  const completedAt=new Date();
  const interval=row.asset.maintenanceIntervalDays||180;
  const next=new Date(completedAt); next.setDate(next.getDate()+interval);
  await prisma.$transaction([
    prisma.maintenanceEvent.update({where:{id},data:{completedAt,status:'COMPLETED',cost:costRaw?Number(costRaw):row.cost}}),
    prisma.asset.update({where:{id:row.assetId},data:{lastMaintenanceAt:completedAt,nextMaintenanceAt:next,status:'HEALTHY'}}),
    prisma.maintenanceEvent.create({data:{assetId:row.assetId,userId:u.id,title:`صيانة ${row.asset.name}`,dueAt:next,status:'SCHEDULED'}})
  ]);
  revalidatePath('/maintenance'); revalidatePath('/dashboard'); revalidatePath('/assets'); revalidatePath('/expenses');
}
