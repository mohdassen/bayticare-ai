import { NextResponse } from 'next/server'; import bcrypt from 'bcryptjs'; import { prisma } from '@/lib/prisma'; import { createSession } from '@/lib/auth';
export async function POST(req:Request){
  try{
    const {email,password}=await req.json();
    const user=await prisma.user.findUnique({where:{email:String(email||'').toLowerCase()}});
    if(!user||!await bcrypt.compare(String(password||''),user.passwordHash))return NextResponse.json({error:'البريد الإلكتروني أو كلمة المرور غير صحيحة'},{status:401});
    await createSession(user.id);
    return NextResponse.json({ok:true});
  }catch(error){
    console.error('login failed',error);
    return NextResponse.json({error:'تعذر تسجيل الدخول الآن. حاول مرة أخرى بعد قليل.'},{status:500});
  }
}
