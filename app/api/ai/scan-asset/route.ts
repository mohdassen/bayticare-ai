import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAIProvider } from '@/lib/ai/provider';

const allowed = new Set(['image/jpeg','image/png','image/webp']);

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'اختر صورة للجهاز' }, { status: 400 });
    if (!allowed.has(file.type)) return NextResponse.json({ error: 'الصيغ المدعومة: JPG, PNG, WEBP' }, { status: 400 });
    if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: 'حجم الصورة يجب ألا يتجاوز 8MB' }, { status: 400 });
    const base64 = Buffer.from(await file.arrayBuffer()).toString('base64');
    const result = await getAIProvider().scanAsset({ imageBase64: base64, mimeType: file.type });
    const mode = process.env.OPENAI_API_KEY ? 'ai' : 'mock';
    return NextResponse.json({ ...result, mode });
  } catch (error) {
    console.error('asset scan failed', error);
    return NextResponse.json({ error: 'تعذر تحليل الصورة الآن. حاول بصورة أوضح.' }, { status: 500 });
  }
}
