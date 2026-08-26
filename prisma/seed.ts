import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma=new PrismaClient();

async function main(){
  const user=await prisma.user.upsert({where:{email:'demo@bayticare.sa'},update:{},create:{name:'محمد',email:'demo@bayticare.sa',phone:'+966500000000',passwordHash:await bcrypt.hash('Demo1234!',12)}});
  let p=await prisma.property.findFirst({where:{ownerId:user.id,name:'فيلا الرياض'}});
  if(!p)p=await prisma.property.create({data:{ownerId:user.id,name:'فيلا الرياض',type:'VILLA',ownership:'OWNED',city:'Riyadh',district:'Al Narjis'}});
  const count=await prisma.asset.count({where:{propertyId:p.id}});
  if(!count){
    for(const a of [
      {name:'مكيف الصالة',category:'Air Conditioner',manufacturer:'Carrier',model:'24K BTU',days:120},
      {name:'ثلاجة المطبخ',category:'Refrigerator',manufacturer:'Samsung',model:'Family Hub',days:365},
      {name:'خزان المياه',category:'Water Tank',manufacturer:'Local',model:'2000L',days:180}
    ]){
      const due=new Date();due.setDate(due.getDate()+a.days);
      const asset=await prisma.asset.create({data:{propertyId:p.id,name:a.name,category:a.category,manufacturer:a.manufacturer,model:a.model,maintenanceIntervalDays:a.days,nextMaintenanceAt:due,status:'HEALTHY'}});
      await prisma.maintenanceEvent.create({data:{assetId:asset.id,userId:user.id,title:`صيانة ${a.name}`,dueAt:due}});
    }
  }

  for(const provider of [
    {name:'BaytiCare AC Demo',city:'Riyadh',rating:4.8,categories:'AC,CLEANING',description:'مزود تجريبي لخدمات التكييف والصيانة الوقائية'},
    {name:'BaytiCare Home Services Demo',city:'Riyadh',rating:4.6,categories:'PLUMBING,ELECTRICAL,WATER_TANK',description:'مزود تجريبي لخدمات المنزل العامة'}
  ]){
    const exists=await prisma.provider.findFirst({where:{name:provider.name}});
    if(!exists) await prisma.provider.create({data:{...provider,status:'VERIFIED'}});
  }
  console.log('Demo: demo@bayticare.sa / Demo1234!');
}
main().finally(()=>prisma.$disconnect());
