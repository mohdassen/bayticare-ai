import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAIConfiguration, getAIProvider } from '@/lib/ai/provider';

const allowed = new Set(['image/jpeg','image/png','image/webp']);

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'اختر صورة للفاتورة أو الضمان' }, { status: 400 });
    if (!allowed.has(file.type)) return NextResponse.json({ error: 'التحليل الذكي الحالي يدعم صور JPG, PNG, WEBP. يمكنك حفظ PDF في الخزنة بدون تحليل.' }, { status: 400 });
    if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: 'حجم الصورة يجب ألا يتجاوز 8MB' }, { status: 400 });
    const base64 = Buffer.from(await file.arrayBuffer()).toString('base64');
    const config = getAIConfiguration();
    console.info('document scan provider', { provider: config.provider, model: config.model, keyConfigured: config.keyConfigured, providerValue: config.providerValue });
    const result = await getAIProvider().scanDocument({ fileBase64: base64, mimeType: file.type });
    return NextResponse.json({ ...result, mode: config.provider });
  } catch (error) {
    console.error('document scan failed', error);
    return NextResponse.json({ error: 'تعذر قراءة الوثيقة الآن. حاول بصورة أوضح ومباشرة.' }, { status: 500 });
  }
}
