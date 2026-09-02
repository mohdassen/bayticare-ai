/**
 * Canonical, stable app URL for building absolute links (referral links, QR
 * codes). `VERCEL_URL` is deployment-specific and changes on every deploy —
 * never use it to represent "the app" in production, only as a preview-env
 * fallback.
 */
export function appBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_ENV === 'production') return 'https://bayticare-ai.vercel.app';
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'https://bayticare-ai.vercel.app';
}
