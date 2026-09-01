import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAIConfiguration, getAIProvider } from '@/lib/ai/provider';
import { rateLimit } from '@/lib/rateLimit';
import { extractZatcaFromImage } from '@/lib/zatca';

const allowed = new Set(['image/jpeg','image/png','image/webp']);

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'انتهت جلستك. سجل الدخول مرة أخرى.' }, { status: 401 });
  const limited = rateLimit(`ai-scan:${user.id}`, 20, 10 * 60 * 1000);
  if (!limited.ok) return NextResponse.json({ error: 'وصلت للحد الأقصى من عمليات المسح مؤقتًا. حاول بعد قليل أو أدخل البيانات يدويًا.' }, { status: 429 });
  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'اختر صورة للفاتورة أو الضمان' }, { status: 400 });
    if (!allowed.has(file.type)) return NextResponse.json({ error: 'التحليل الذكي الحالي يدعم صور JPG, PNG, WEBP. يمكنك حفظ PDF في الخزنة بدون تحليل.' }, { status: 400 });
    if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: 'حجم الصورة يجب ألا يتجاوز 8MB' }, { status: 400 });
    const bytes = new Uint8Array(await file.arrayBuffer());
    const base64 = Buffer.from(bytes).toString('base64');
    const config = getAIConfiguration();
    console.info('document scan provider', { provider: config.provider, model: config.model, keyConfigured: config.keyConfigured, providerValue: config.providerValue });
    const [zatca, result] = await Promise.all([
      extractZatcaFromImage(bytes, file.type),
      getAIProvider().scanDocument({ fileBase64: base64, mimeType: file.type }),
    ]);
    // ZATCA QR data comes straight from the invoice issuer's own signed e-invoice
    // record, so it's authoritative for the fields it covers - prefer it over the
    // AI vision guess, and never let a missing/unreadable QR block the AI result.
    const merged = {
      ...result,
      merchant: zatca?.sellerName ?? result.merchant,
      price: zatca?.total ?? result.price,
      vat: zatca?.vatAmount ?? result.vat,
      purchaseDate: (zatca?.timestamp && !Number.isNaN(Date.parse(zatca.timestamp)) ? zatca.timestamp.slice(0, 10) : undefined) ?? result.purchaseDate,
      vatNumber: zatca?.vatNumber,
      confidence: zatca ? Math.max(result.confidence, 0.95) : result.confidence,
    };
    return NextResponse.json({ ...merged, mode: config.provider, verifiedByZatca: !!zatca });
  } catch (error) {
    console.error('document scan failed', error);
    return NextResponse.json({ error: 'تعذر قراءة الوثيقة الآن. حاول بصورة أوضح ومباشرة.' }, { status: 500 });
  }
}
