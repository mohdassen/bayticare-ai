import { NextResponse } from 'next/server';
import { getAIConfiguration } from '@/lib/ai/provider';

export async function GET() {
  const config = getAIConfiguration();
  return NextResponse.json({
    ok: true,
    aiEnabled: config.enabled,
    provider: config.provider,
    model: config.model,
    keyConfigured: config.keyConfigured,
    providerValue: config.providerValue,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
  }, { headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
}
