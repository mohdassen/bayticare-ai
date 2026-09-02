'use client';
import { useState } from 'react';

export function CopyLinkButton({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }
  return <button type="button" className="btn small" onClick={copy}>{copied ? '✓ تم النسخ' : 'نسخ الرابط'}</button>;
}
