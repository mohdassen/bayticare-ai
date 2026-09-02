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
  provider: 'gemini' | 'openai' | 'mock';
  model: string;
  keyConfigured: boolean;
  providerValue: string;
};

const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite';

export function getAIConfiguration(): AIConfiguration {
  const providerValue = (process.env.AI_PROVIDER || '').trim().toLowerCase();
  const geminiKey = (process.env.GEMINI_API_KEY || '').trim();
  const openaiKey = (process.env.OPENAI_API_KEY || '').trim();

  if ((providerValue === 'gemini' || !providerValue) && geminiKey.length > 20) {
    return { enabled: true, provider: 'gemini', model: (process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL).trim(), keyConfigured: true, providerValue: providerValue || '(auto)' };
  }
  if ((providerValue === 'openai' || (!providerValue && !geminiKey)) && openaiKey.length > 20) {
    return { enabled: true, provider: 'openai', model: (process.env.OPENAI_MODEL || 'gpt-5.6').trim(), keyConfigured: true, providerValue: providerValue || '(auto)' };
  }
  return {
    enabled: false,
    provider: 'mock',
    model: providerValue === 'gemini' ? (process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL).trim() : (process.env.OPENAI_MODEL || 'gpt-5.6').trim(),
    keyConfigured: providerValue === 'gemini' ? geminiKey.length > 20 : openaiKey.length > 20,
    providerValue: providerValue || '(not set)',
  };
}

// OpenAI accepts JSON-Schema union type arrays. Gemini's responseSchema uses
// OpenAPI-style schemas, where nullable fields are represented with nullable:true.
const openAIAssetSchema = {
  type: 'object',
  properties: {
    category: { type: ['string','null'] }, manufacturer: { type: ['string','null'] }, model: { type: ['string','null'] }, serialNumber: { type: ['string','null'] }, confidence: { type: 'number' }
  },
  required: ['category','manufacturer','model','serialNumber','confidence']
};
const geminiAssetSchema = {
  type: 'object',
  properties: {
    category: { type: 'string', nullable: true }, manufacturer: { type: 'string', nullable: true }, model: { type: 'string', nullable: true }, serialNumber: { type: 'string', nullable: true }, confidence: { type: 'number' }
  },
  required: ['category','manufacturer','model','serialNumber','confidence']
};
const openAIDocumentSchema = {
  type: 'object',
  properties: {
    merchant: { type: ['string','null'] }, invoiceNumber: { type: ['string','null'] }, purchaseDate: { type: ['string','null'] }, product: { type: ['string','null'] }, model: { type: ['string','null'] }, serialNumber: { type: ['string','null'] }, price: { type: ['number','null'] }, vat: { type: ['number','null'] }, warrantyMonths: { type: ['number','null'] }, confidence: { type: 'number' }
  },
  required: ['merchant','invoiceNumber','purchaseDate','product','model','serialNumber','price','vat','warrantyMonths','confidence']
};
const geminiDocumentSchema = {
  type: 'object',
  properties: {
    merchant: { type: 'string', nullable: true }, invoiceNumber: { type: 'string', nullable: true }, purchaseDate: { type: 'string', nullable: true }, product: { type: 'string', nullable: true }, model: { type: 'string', nullable: true }, serialNumber: { type: 'string', nullable: true }, price: { type: 'number', nullable: true }, vat: { type: 'number', nullable: true }, warrantyMonths: { type: 'number', nullable: true }, confidence: { type: 'number' }
  },
  required: ['merchant','invoiceNumber','purchaseDate','product','model','serialNumber','price','vat','warrantyMonths','confidence']
};
const severityEnum = ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'];
const openAIDiagnoseSchema = {
  type: 'object',
  properties: {
    summary: { type: 'string' }, severity: { type: 'string', enum: severityEnum }, category: { type: ['string','null'] }, confidence: { type: 'number' }
  },
  required: ['summary','severity','category','confidence']
};
const geminiDiagnoseSchema = {
  type: 'object',
  properties: {
    summary: { type: 'string' }, severity: { type: 'string', enum: severityEnum }, category: { type: 'string', nullable: true }, confidence: { type: 'number' }
  },
  required: ['summary','severity','category','confidence']
};
const DIAGNOSE_PROMPT = 'You are a cautious home-maintenance triage assistant for a Saudi homeowner using BaytiCare. The user describes a household issue in Arabic or English. Respond ONLY in Arabic. Write a short, practical summary (2-4 sentences): likely cause(s) in plain language, and a clear next step (e.g. "احجز فني تكييف" or "راقب الحالة"). Never give definitive electrical/gas/structural safety verdicts - for anything involving electricity, gas, fire, smoke, water damage near electrical points, or structural cracks, set severity to HIGH or EMERGENCY and recommend professional inspection rather than DIY. severity: LOW routine/cosmetic, MEDIUM needs attention soon, HIGH needs prompt professional attention, EMERGENCY immediate danger. category should be a short device/system category if identifiable (e.g. "تكييف", "سباكة", "كهرباء") or null. confidence (0-1) must reflect genuine uncertainty - lower it when the description is vague.';

function clean<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).map(([k,v]) => [k, v === null ? undefined : v])) as T;
}
type OpenAIResponseJSON = { output_text?: unknown; output?: Array<{ type?: unknown; content?: Array<{ type?: unknown; text?: unknown }> }> };
type GeminiResponseJSON = { candidates?: Array<{ content?: { parts?: Array<{ text?: unknown }> } }> };

function getOpenAIResponseText(json: OpenAIResponseJSON): string {
  if (typeof json?.output_text === 'string') return json.output_text;
  const message = Array.isArray(json?.output) ? json.output.find((x) => x?.type === 'message') : undefined;
  const text = message?.content?.find((x) => x?.type === 'output_text')?.text;
  if (typeof text === 'string') return text;
  throw new Error('AI response did not contain text output');
}
function getGeminiResponseText(json: GeminiResponseJSON): string {
  const text = json?.candidates?.[0]?.content?.parts?.find((p) => typeof p?.text === 'string')?.text;
  if (typeof text === 'string') return text;
  throw new Error('Gemini response did not contain text output');
}

class GeminiProvider implements AIProvider {
  private key = (process.env.GEMINI_API_KEY || '').trim();
  private model = (process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL).trim();
  private async visionJSON(prompt: string, base64: string, mimeType: string, schema: object) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.key)}`;
    const res = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }, { inlineData: { mimeType, data: base64 } }] }], generationConfig: { responseMimeType: 'application/json', responseSchema: schema } }),
      signal: AbortSignal.timeout(45000)
    });
    if (!res.ok) {
      const body = await res.text().catch(()=> '');
      console.error('Gemini response error', { status: res.status, body: body.slice(0, 1000), model: this.model });
      throw new Error(`Gemini provider error ${res.status}`);
    }
    const json = await res.json();
    const parsed = JSON.parse(getGeminiResponseText(json));
    return { parsed, raw: { model: this.model, usage: json.usageMetadata, finishReason: json?.candidates?.[0]?.finishReason } };
  }
  private async textJSON(prompt: string, userText: string, schema: object) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.key)}`;
    const res = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: `${prompt}\n\nUser's issue description:\n${userText}` }] }], generationConfig: { responseMimeType: 'application/json', responseSchema: schema } }),
      signal: AbortSignal.timeout(30000)
    });
    if (!res.ok) {
      const body = await res.text().catch(()=> '');
      console.error('Gemini response error', { status: res.status, body: body.slice(0, 1000), model: this.model });
      throw new Error(`Gemini provider error ${res.status}`);
    }
    const json = await res.json();
    return JSON.parse(getGeminiResponseText(json));
  }
  async scanAsset(input: { imageBase64: string; mimeType: string }): Promise<AssetScanResult> {
    const { parsed, raw } = await this.visionJSON('Analyze this household appliance or home asset photo for BaytiCare. Read any visible label carefully. Return only data visible or strongly inferable from the image. category should be a concise English category such as Air Conditioner, Refrigerator, Washer, Water Heater, Water Pump, Water Tank, Water Filter, CCTV, or Other. Never invent model or serial numbers. confidence must be between 0 and 1 and reflect extraction confidence.', input.imageBase64, input.mimeType, geminiAssetSchema);
    return { ...clean(parsed), raw } as AssetScanResult;
  }
  async scanDocument(input: { fileBase64: string; mimeType: string }): Promise<DocumentScanResult> {
    const { parsed, raw } = await this.visionJSON('Analyze this purchase invoice, warranty card, receipt, or service document for a Saudi homeowner. Extract only fields that are visible. purchaseDate must use YYYY-MM-DD when confidently readable. price and vat should be numeric SAR amounts when present. warrantyMonths is the explicit warranty duration in months when stated. Never invent missing data. confidence must be between 0 and 1.', input.fileBase64, input.mimeType, geminiDocumentSchema);
    return { ...clean(parsed), raw } as DocumentScanResult;
  }
  async diagnoseIssue(input: { text: string }): Promise<{ summary: string; severity: 'LOW'|'MEDIUM'|'HIGH'|'EMERGENCY'; category?: string; confidence: number }> {
    const parsed = await this.textJSON(DIAGNOSE_PROMPT, input.text, geminiDiagnoseSchema);
    return clean(parsed) as { summary: string; severity: 'LOW'|'MEDIUM'|'HIGH'|'EMERGENCY'; category?: string; confidence: number };
  }
}

class OpenAIProvider implements AIProvider {
  private key = (process.env.OPENAI_API_KEY || '').trim();
  private model = (process.env.OPENAI_MODEL || 'gpt-5.6').trim();
  private async visionJSON(prompt: string, base64: string, mimeType: string, name: string, schema: object) {
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST', headers: { 'Authorization': `Bearer ${this.key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.model, input: [{ role: 'user', content: [{ type: 'input_text', text: prompt }, { type: 'input_image', image_url: `data:${mimeType};base64,${base64}`, detail: 'high' }] }], text: { format: { type: 'json_schema', name, strict: true, schema } } }),
      signal: AbortSignal.timeout(45000)
    });
    if (!res.ok) {
      const body = await res.text().catch(()=> '');
      console.error('OpenAI response error', { status: res.status, body: body.slice(0, 500), model: this.model });
      throw new Error(`AI provider error ${res.status}`);
    }
    const json = await res.json();
    return { parsed: JSON.parse(getOpenAIResponseText(json)), raw: { id: json.id, model: json.model, usage: json.usage } };
  }
  private async textJSON(prompt: string, userText: string, name: string, schema: object) {
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST', headers: { 'Authorization': `Bearer ${this.key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.model, input: [{ role: 'user', content: [{ type: 'input_text', text: `${prompt}\n\nUser's issue description:\n${userText}` }] }], text: { format: { type: 'json_schema', name, strict: true, schema } } }),
      signal: AbortSignal.timeout(30000)
    });
    if (!res.ok) {
      const body = await res.text().catch(()=> '');
      console.error('OpenAI response error', { status: res.status, body: body.slice(0, 500), model: this.model });
      throw new Error(`AI provider error ${res.status}`);
    }
    const json = await res.json();
    return JSON.parse(getOpenAIResponseText(json));
  }
  async scanAsset(input: { imageBase64: string; mimeType: string }): Promise<AssetScanResult> {
    const { parsed, raw } = await this.visionJSON('Analyze this household appliance photo. Read visible labels carefully. Never invent model or serial numbers. confidence must be 0-1.', input.imageBase64, input.mimeType, 'bayticare_asset_scan', openAIAssetSchema);
    return { ...clean(parsed), raw } as AssetScanResult;
  }
  async scanDocument(input: { fileBase64: string; mimeType: string }): Promise<DocumentScanResult> {
    const { parsed, raw } = await this.visionJSON('Analyze this invoice or warranty document. Extract visible data only and never invent missing values.', input.fileBase64, input.mimeType, 'bayticare_document_scan', openAIDocumentSchema);
    return { ...clean(parsed), raw } as DocumentScanResult;
  }
  async diagnoseIssue(input: { text: string }): Promise<{ summary: string; severity: 'LOW'|'MEDIUM'|'HIGH'|'EMERGENCY'; category?: string; confidence: number }> {
    const parsed = await this.textJSON(DIAGNOSE_PROMPT, input.text, 'bayticare_diagnose_issue', openAIDiagnoseSchema);
    return clean(parsed) as { summary: string; severity: 'LOW'|'MEDIUM'|'HIGH'|'EMERGENCY'; category?: string; confidence: number };
  }
}

class MockAIProvider implements AIProvider {
  async scanAsset(): Promise<AssetScanResult> { return { confidence: 0, raw: { mode: 'mock', message: 'Configure GEMINI_API_KEY or OPENAI_API_KEY.' } }; }
  async scanDocument(): Promise<DocumentScanResult> { return { confidence: 0, raw: { mode: 'mock', message: 'Configure GEMINI_API_KEY or OPENAI_API_KEY.' } }; }
  async diagnoseIssue(input: { text: string }): Promise<{ summary: string; severity: 'LOW'|'MEDIUM'|'HIGH'|'EMERGENCY'; category?: string; confidence: number }> {
    return { summary: `تم استلام وصف المشكلة: ${input.text}. يلزم تفعيل مزود AI للحصول على تحليل أعمق.`, severity: 'LOW', confidence: 0 };
  }
}

export function getAIProvider(): AIProvider {
  const config = getAIConfiguration();
  if (config.provider === 'gemini') return new GeminiProvider();
  if (config.provider === 'openai') return new OpenAIProvider();
  return new MockAIProvider();
}
