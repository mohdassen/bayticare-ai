'use server';

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getAIProvider } from '@/lib/ai/provider';

export async function diagnoseIssue(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const text = String(formData.get('text') || '').trim().slice(0, 3000);
  if (!text) redirect('/ai?error=missing');

  const dangerous = /(حريق|دخان|رائحة غاز|تماس كهربائي|شرر|انهيار|fire|smoke|gas leak|electric shock|sparks)/i.test(text);
  if (dangerous) {
    redirect(`/ai?severity=EMERGENCY&confidence=100&summary=${encodeURIComponent('قد تكون الحالة خطرة. ابتعد عن مصدر الخطر ولا تحاول الإصلاح بنفسك، واتصل بخدمة الطوارئ أو فني مختص حسب الحالة.')}`);
  }

  let result;
  try {
    result = await getAIProvider().diagnoseIssue({ text });
  } catch (error) {
    console.error('diagnoseIssue failed', error);
    redirect(`/ai?error=${encodeURIComponent('تعذر تحليل المشكلة الآن. يمكنك حجز فني مباشرة من صفحة الخدمات.')}`);
  }
  redirect(`/ai?severity=${result.severity}&confidence=${Math.round(result.confidence*100)}&summary=${encodeURIComponent(result.summary)}${result.category?`&category=${encodeURIComponent(result.category)}`:''}`);
}
