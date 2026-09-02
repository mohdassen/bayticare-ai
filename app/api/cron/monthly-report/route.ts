import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getEmailProvider } from '@/lib/email';
import { buildHomeReport, renderReportHtml } from '@/lib/report';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = (process.env.CRON_SECRET || '').trim();
  if (!secret) {
    console.warn('monthly-report cron called but CRON_SECRET is not configured — refusing to run');
    return NextResponse.json({ ok: false, error: 'CRON_SECRET not configured' }, { status: 503 });
  }
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: { properties: { some: {} } },
    select: { id: true, name: true, email: true },
  });

  let sent = 0;
  let failed = 0;
  for (const user of users) {
    try {
      const report = await buildHomeReport(user.id);
      if (!report) continue;
      await getEmailProvider().send({
        to: user.email,
        subject: `تقرير صحة منزلك الشهري — ${report.health.score}/100`,
        html: renderReportHtml(user.name, report),
      });
      sent++;
    } catch (error) {
      failed++;
      console.error('monthly report failed for user', user.id, error);
    }
  }

  return NextResponse.json({ ok: true, totalUsers: users.length, sent, failed });
}
