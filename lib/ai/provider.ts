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

export type AIConfiguration = {
  enabled: boolean;
  provider: 'openai' | 'mock';
  model: string;
  keyConfigured: boolean;
  providerValue: string;
};

export function getAIConfiguration(): AIConfiguration {
  const key = (process.env.OPENAI_API_KEY || '').trim();
  const providerValue = (process.env.AI_PROVIDER || '').trim().toLowerCase();
  const providerAllowed = !providerValue || providerValue === 'openai';
  const enabled = key.length > 20 && providerAllowed;
  return {
    enabled,
    provider: enabled ? 'openai' : 'mock',
    model: (process.env.OPENAI_MODEL || 'gpt-5.6').trim(),
    keyConfigured: key.length > 20,
    providerValue: providerValue || '(not set)',
  };
}

const assetSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    category: { type: ['string','null'] },
    manufacturer: { type: ['string','null'] },
    model: { type: ['string','null'] },
    serialNumber: { type: ['string','null'] },
    confidence: { type: 'number', minimum: 0, maximum: 1 }
  },
  required: ['category','manufacturer','model','serialNumber','confidence']
};

const documentSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    merchant: { type: ['string','null'] },
    invoiceNumber: { type: ['string','null'] },
    purchaseDate: { type: ['string','null'] },
    product: { type: ['string','null'] },
    model: { type: ['string','null'] },
    serialNumber: { type: ['string','null'] },
    price: { type: ['number','null'] },
    vat: { type: ['number','null'] },
    warrantyMonths: { type: ['number','null'] },
    confidence: { type: 'number', minimum: 0, maximum: 1 }
  },
  required: ['merchant','invoiceNumber','purchaseDate','product','model','serialNumber','price','vat','warrantyMonths','confidence']
};

function clean<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).map(([k,v]) => [k, v === null ? undefined : v])) as T;
}

function getResponseText(json: any): string {
  if (typeof json?.output_text === 'string') return json.output_text;
  const message = Array.isArray(json?.output) ? json.output.find((x:any)=>x?.type==='message') : undefined;
  const text = message?.content?.find((x:any)=>x?.type==='output_text')?.text;
  if (typeof text === 'string') return text;
  throw new Error('AI response did not contain text output');
}

class OpenAIProvider implements AIProvider {
  private key = (process.env.OPENAI_API_KEY || '').trim();
  private model = (process.env.OPENAI_MODEL || 'gpt-5.6').trim();

  private async visionJSON(prompt: string, base64: string, mimeType: string, name: string, schema: object) {
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        input: [{ role: 'user', content: [
          { type: 'input_text', text: prompt },
          { type: 'input_image', image_url: `data:${mimeType};base64,${base64}`, detail: 'high' }
        ]}],
        text: { format: { type: 'json_schema', name, strict: true, schema } }
      }),
      signal: AbortSignal.timeout(45000)
    });
    if (!res.ok) {
      const body = await res.text().catch(()=>'');
      console.error('OpenAI response error', { status: res.status, body: body.slice(0, 500), model: this.model });
      throw new Error(`AI provider error ${res.status}`);
    }
    const json = await res.json();
    return { parsed: JSON.parse(getResponseText(json)), raw: { id: json.id, model: json.model, usage: json.usage } };
  }

  async scanAsset(input: { imageBase64: string; mimeType: string }): Promise<AssetScanResult> {
    const { parsed, raw } = await this.visionJSON(
      'Analyze this household appliance or home asset photo for BaytiCare. Read any visible label carefully. Return only data visible or strongly inferable from the image. category should be a concise English category such as Air Conditioner, Refrigerator, Washer, Water Heater, Water Pump, Water Tank, Water Filter, CCTV, or Other. Do not invent model or serial numbers. confidence must reflect overall extraction confidence.',
      input.imageBase64, input.mimeType, 'bayticare_asset_scan', assetSchema
    );
    return { ...clean(parsed), raw } as AssetScanResult;
  }

  async scanDocument(input: { fileBase64: string; mimeType: string }): Promise<DocumentScanResult> {
    const { parsed, raw } = await this.visionJSON(
      'Analyze this purchase invoice, warranty card, receipt, or service document for a Saudi homeowner. Extract only fields that are actually visible. purchaseDate must use YYYY-MM-DD when confidently readable. price and vat should be numeric SAR amounts when present. warrantyMonths is the explicit warranty duration in months when stated. Never invent missing data. confidence must reflect overall extraction confidence.',
      input.fileBase64, input.mimeType, 'bayticare_document_scan', documentSchema
    );
    return { ...clean(parsed), raw } as DocumentScanResult;
  }

  async diagnoseIssue(input: { text: string }): Promise<{ summary: string; severity: 'LOW'|'MEDIUM'|'HIGH'|'EMERGENCY'; category?: string; confidence: number }> {
    return { summary: `تم استلام وصف المشكلة: ${input.text}. استخدم حجز فني مؤهل إذا استمرت المشكلة أو كان هناك خطر.`, severity: 'LOW', confidence: 0.35 };
  }
}

class MockAIProvider implements AIProvider {
  async scanAsset(): Promise<AssetScanResult> {
    return { confidence: 0, raw: { mode: 'mock', message: 'Configure OPENAI_API_KEY to enable visual recognition.' } };
  }
  async scanDocument(): Promise<DocumentScanResult> {
    return { confidence: 0, raw: { mode: 'mock', message: 'Configure OPENAI_API_KEY to enable document extraction.' } };
  }
  async diagnoseIssue(input: { text: string }): Promise<{ summary: string; severity: 'LOW'|'MEDIUM'|'HIGH'|'EMERGENCY'; category?: string; confidence: number }> {
    return { summary: `تم استلام وصف المشكلة: ${input.text}. يلزم تفعيل مزود AI للحصول على تحليل أعمق.`, severity: 'LOW', confidence: 0 };
  }
}

export function getAIProvider(): AIProvider {
  return getAIConfiguration().enabled ? new OpenAIProvider() : new MockAIProvider();
}
