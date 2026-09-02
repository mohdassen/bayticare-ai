import { redirect, notFound } from 'next/navigation';
import QRCode from 'qrcode';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PrintButton } from '@/components/PrintButton';
import { appBaseUrl } from '@/lib/url';

export default async function AssetLabelPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const { id } = await params;

  const asset = await prisma.asset.findFirst({
    where: { id, property: { ownerId: user.id } },
    select: { id: true, name: true, category: true, property: { select: { name: true } } },
  });
  if (!asset) notFound();

  const assetUrl = `${appBaseUrl()}/assets/${asset.id}`;
  const qrDataUrl = await QRCode.toDataURL(assetUrl, { margin: 1, width: 240, color: { dark: '#0f6a48', light: '#ffffff' } });

  return <main style={{ minHeight: '100vh', background: '#f2f6f2', padding: 24 }}>
    <style>{`
      .labelWrap{max-width:420px;margin:0 auto}
      .label{background:#fff;border:1.5px dashed #9dc5ae;border-radius:18px;padding:24px;text-align:center;font-family:var(--font-tajawal),Arial,sans-serif}
      .label img{width:160px;height:160px}
      .labelBrand{font-size:13px;font-weight:900;color:#0f6a48;margin-top:10px}
      .labelName{font-size:17px;font-weight:800;margin-top:4px}
      .labelSub{font-size:12px;color:#6f7d75;margin-top:2px}
      @media print{.no-print{display:none}body{background:#fff}.label{border-style:solid}}
    `}</style>
    <div className="labelWrap">
      <div className="no-print" style={{ marginBottom: 16 }}><PrintButton label="🖨️ طباعة الملصق" /></div>
      <div className="label">
        {/* eslint-disable-next-line @next/next/no-img-element -- server-generated data: URI, next/image can't optimize it */}
        <img src={qrDataUrl} alt="QR" />
        <div className="labelBrand">Bayti Care</div>
        <div className="labelName">{asset.name}</div>
        <div className="labelSub">{asset.property.name} · صوّر الرمز لعرض سجل الجهاز</div>
      </div>
    </div>
  </main>;
}
