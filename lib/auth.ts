import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'development-secret-change-me');
const COOKIE = 'bayticare_session';

export async function createSession(userId: string) {
  const token = await new SignJWT({ userId }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('7d').sign(secret);
  const store = await cookies();
  store.set(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 7 });
}
export async function clearSession() { const store = await cookies(); store.delete(COOKIE); }
export async function getCurrentUser() {
  try {
    const token = (await cookies()).get(COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret);
    if (!payload.userId) return null;
    return prisma.user.findUnique({ where: { id: String(payload.userId) }, select: { id: true, name: true, email: true, role: true, locale: true } });
  } catch { return null; }
}
