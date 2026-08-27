import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAIConfiguration } from '@/lib/ai/provider';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  const config = getAIConfiguration();
  return NextResponse.json({
    ok: true,
    aiEnabled: config.enabled,
    provider: config.provider,
    model: config.model,
    keyConfigured: config.keyConfigured,
    providerValue: config.providerValue,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
  });
}
