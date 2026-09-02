import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth';
import { rateLimit, clientKey } from '@/lib/rateLimit';

const schema = z.object({
  name: z.string().trim().min(2, 'الاسم قصير جدًا'),
  email: z.string().trim().email('البريد الإلكتروني غير صحيح'),
  phone: z.string().trim().optional(),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  ref: z.string().trim().optional(),
});

export async function POST(req: Request) {
  const limited = rateLimit(`register:${clientKey(req)}`, 5, 15 * 60 * 1000);
  if (!limited.ok) return NextResponse.json({ error: 'محاولات كثيرة. حاول بعد قليل.' }, { status: 429 });
  try {
    const payload = await req.json();
    const parsed = schema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'البيانات المدخلة غير صحيحة' },
        { status: 400 },
      );
    }

    const d = parsed.data;
    const email = d.email.toLowerCase();
    const exists = await prisma.user.findUnique({ where: { email } });

    if (exists) {
      return NextResponse.json(
        { error: 'يوجد حساب مسجل بهذا البريد الإلكتروني' },
        { status: 409 },
      );
    }

    const user = await prisma.user.create({
      data: {
        name: d.name,
        email,
        phone: d.phone || null,
        passwordHash: await bcrypt.hash(d.password, 12),
      },
    });

    if (d.ref && d.ref !== user.id) {
      // Best-effort: the Referral table needs `prisma db push` to exist in
      // production yet. Never let this block or fail registration.
      await prisma.referral
        .create({ data: { referrerId: d.ref, refereeEmail: email, refereeUserId: user.id } })
        .catch((error) => console.error('referral log failed (non-blocking)', error));
    }

    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'يوجد حساب مسجل بهذه البيانات' },
        { status: 409 },
      );
    }

    console.error('Registration failed', error);
    return NextResponse.json(
      { error: 'تعذر إنشاء الحساب الآن. حاول مرة أخرى بعد قليل.' },
      { status: 500 },
    );
  }
}
