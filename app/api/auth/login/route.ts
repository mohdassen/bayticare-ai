import { NextResponse } from 'next/server'; import bcrypt from 'bcryptjs'; import { prisma } from '@/lib/prisma'; import { createSession } from '@/lib/auth'; import { rateLimit, clientKey } from '@/lib/rateLimit';
export async function POST(req:Request){
  const limited=rateLimit(`login:${clientKey(req)}`,10,5*60*1000);
  if(!limited.ok)return NextResponse.json({error:'محاولات دخول كثيرة. حاول بعد قليل.'},{status:429});
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
