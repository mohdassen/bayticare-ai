export interface EmailProvider {
  send(input: { to: string; subject: string; html: string }): Promise<void>;
}

/** No email service configured — logs instead of sending. Safe default. */
class ConsoleEmailProvider implements EmailProvider {
  async send(input: { to: string; subject: string; html: string }): Promise<void> {
    console.info('email not sent (no EMAIL provider configured)', { to: input.to, subject: input.subject });
  }
}

/** Sends via the Resend HTTP API. Activates automatically once RESEND_API_KEY is set. */
class ResendEmailProvider implements EmailProvider {
  private key = (process.env.RESEND_API_KEY || '').trim();
  private from = process.env.EMAIL_FROM || 'BaytiCare <onboarding@resend.dev>';

  async send(input: { to: string; subject: string; html: string }): Promise<void> {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: this.from, to: [input.to], subject: input.subject, html: input.html }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('Resend send failed', { status: res.status, body: body.slice(0, 300) });
      throw new Error(`Email provider error ${res.status}`);
    }
  }
}

export function isEmailConfigured(): boolean {
  return (process.env.RESEND_API_KEY || '').trim().length > 10;
}

export function getEmailProvider(): EmailProvider {
  return isEmailConfigured() ? new ResendEmailProvider() : new ConsoleEmailProvider();
}
