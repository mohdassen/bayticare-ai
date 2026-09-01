export type ZatcaInvoice = {
  sellerName?: string;
  vatNumber?: string;
  timestamp?: string;
  total?: number;
  vatAmount?: number;
};

/**
 * Saudi e-invoices (per ZATCA / Fatoora regulation) embed a QR code containing a
 * base64-encoded TLV (Tag-Length-Value) byte sequence: tag 1 = seller name,
 * tag 2 = VAT registration number, tag 3 = ISO timestamp, tag 4 = invoice total
 * (VAT-inclusive), tag 5 = VAT amount. This is structured, non-hallucinated data
 * straight from the invoice issuer's own QR code, so we treat it as authoritative
 * and prefer it over AI-vision-extracted values for the fields it covers.
 */
function parseTlv(buf: Buffer): ZatcaInvoice {
  const result: ZatcaInvoice = {};
  let offset = 0;
  while (offset + 2 <= buf.length) {
    const tag = buf[offset];
    const len = buf[offset + 1];
    const start = offset + 2;
    const end = start + len;
    if (end > buf.length) break;
    const value = buf.subarray(start, end).toString('utf8');
    if (tag === 1) result.sellerName = value;
    else if (tag === 2) result.vatNumber = value;
    else if (tag === 3) result.timestamp = value;
    else if (tag === 4) result.total = Number(value) || undefined;
    else if (tag === 5) result.vatAmount = Number(value) || undefined;
    offset = end;
  }
  return result;
}

/**
 * Attempts to locate and decode a ZATCA QR code inside an uploaded invoice
 * photo. Returns null (never throws) if no QR is found or decoding fails —
 * callers must treat this as a best-effort enrichment, not a hard dependency,
 * so a photo without a readable QR still goes through the normal AI-vision flow.
 */
export async function extractZatcaFromImage(bytes: Uint8Array, mimeType: string): Promise<ZatcaInvoice | null> {
  if (mimeType === 'application/pdf') return null;
  try {
    const [{ Jimp }, jsQRModule] = await Promise.all([import('jimp'), import('jsqr')]);
    const jsQR = jsQRModule.default;
    const image = await Jimp.read(Buffer.from(bytes));
    const { data, width, height } = image.bitmap;
    const code = jsQR(new Uint8ClampedArray(data.buffer, data.byteOffset, data.length), width, height);
    if (!code || !code.data) return null;
    let decoded: Buffer;
    try {
      decoded = Buffer.from(code.data, 'base64');
    } catch {
      return null;
    }
    const parsed = parseTlv(decoded);
    if (!parsed.sellerName && parsed.total === undefined) return null;
    return parsed;
  } catch (error) {
    console.error('zatca qr extraction failed', error);
    return null;
  }
}
