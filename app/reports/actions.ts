'use server';

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getEmailProvider, isEmailConfigured } from '@/lib/email';
import { buildHomeReport, renderReportHtml } from '@/lib/report';

function fail(message: string): never {
  redirect(`/reports?error=${encodeURIComponent(message)}`);
}

export async function sendReportNow() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!isEmailConfigured()) fail('إرسال البريد غير مفعّل حاليًا على هذا الخادم.');

  const report = await buildHomeReport(user.id);
  if (!report) fail('أضف منزلك أولًا لإنشاء تقرير.');

  try {
    await getEmailProvider().send({
      to: user.email,
      subject: `تقرير صحة منزلك — ${report.health.score}/100`,
      html: renderReportHtml(user.name, report),
    });
  } catch (error) {
    console.error('manual report send failed', error);
    fail('تعذر إرسال التقرير الآن. حاول مرة أخرى بعد قليل.');
  }

  redirect('/reports?sent=1');
}
