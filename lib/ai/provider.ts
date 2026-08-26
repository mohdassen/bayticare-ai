export type AssetScanResult = {
  category?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  confidence: number;
  raw?: unknown;
};

export type DocumentScanResult = {
  merchant?: string;
  invoiceNumber?: string;
  purchaseDate?: string;
  product?: string;
  model?: string;
  serialNumber?: string;
  price?: number;
  vat?: number;
  warrantyMonths?: number;
  confidence: number;
  raw?: unknown;
};

export interface AIProvider {
  scanAsset(input: { imageBase64: string; mimeType: string }): Promise<AssetScanResult>;
  scanDocument(input: { fileBase64: string; mimeType: string }): Promise<DocumentScanResult>;
  diagnoseIssue(input: { text: string; imageBase64?: string; mimeType?: string }): Promise<{ summary: string; severity: 'LOW'|'MEDIUM'|'HIGH'|'EMERGENCY'; category?: string; confidence: number }>;
}

class MockAIProvider implements AIProvider {
  async scanAsset(): Promise<AssetScanResult> {
    return { confidence: 0, raw: { mode: 'mock', message: 'Configure an AI provider to enable recognition.' } };
  }
  async scanDocument(): Promise<DocumentScanResult> {
    return { confidence: 0, raw: { mode: 'mock', message: 'Configure an AI provider to enable extraction.' } };
  }
  async diagnoseIssue(input: { text: string }): Promise<{ summary: string; severity: 'LOW'|'MEDIUM'|'HIGH'|'EMERGENCY'; category?: string; confidence: number }> {
    return { summary: `تم استلام وصف المشكلة: ${input.text}. يلزم ربط مزود AI للحصول على تشخيص تحليلي.`, severity: 'LOW', confidence: 0 };
  }
}

export function getAIProvider(): AIProvider {
  // Adapter point for OpenAI-compatible providers or alternative vendors.
  // Until credentials are configured, fail safely with a transparent mock provider.
  return new MockAIProvider();
}
