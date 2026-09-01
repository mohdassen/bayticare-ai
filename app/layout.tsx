import { Tajawal } from 'next/font/google';
import './globals.css';

const tajawal = Tajawal({ subsets: ['arabic', 'latin'], weight: ['400', '500', '700', '800', '900'], variable: '--font-tajawal', display: 'swap' });

export const metadata = { title: 'BaytiCare AI', description: 'The intelligent operating system for your home' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ar" dir="rtl" className={tajawal.variable}><body>{children}</body></html>;
}
