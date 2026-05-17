// Clinical AI service — calls Claude claude-haiku-4-5 via Vite dev proxy (/api/anthropic)
// For preview/production builds, falls back to direct call with the dangerous-browser-access header.

export interface ClinicalAiInput {
  chiefComplaint: string;
  patientAnswers: string;
  vitalSigns?: string;
  patientAge?: number;
  knownAllergies?: string;
  currentMedications?: string;
}

export interface ClinicalAiResponse {
  differentials: string[];
  urgency: 'immediate' | 'urgent' | 'routine';
  investigations: string[];
  medications: { name: string; dose: string; indication: string }[];
  referrals: string[];
  redFlags: string[];
  clinicalPearls: string[];
  raw: string;
}

const SYSTEM_PROMPT = `You are an expert emergency medicine clinician providing real-time clinical decision support inside a hospital EMR.
Given a chief complaint and patient history, provide structured clinical guidance.
Always respond in valid JSON with this exact structure:
{
  "differentials": ["string"],
  "urgency": "immediate" | "urgent" | "routine",
  "investigations": ["string"],
  "medications": [{ "name": "string", "dose": "string", "indication": "string" }],
  "referrals": ["string"],
  "redFlags": ["string"],
  "clinicalPearls": ["string"]
}
Keep each array to 3-6 items max. Be concise but clinically accurate. Follow NHS / NICE guidelines where applicable.
IMPORTANT: This is for clinical decision SUPPORT only — a qualified clinician must review all suggestions.`;

function buildUserMessage(input: ClinicalAiInput): string {
  return [
    `Chief Complaint: ${input.chiefComplaint}`,
    input.patientAge ? `Patient Age: ${input.patientAge} years` : '',
    input.vitalSigns ? `Vital Signs: ${input.vitalSigns}` : '',
    input.knownAllergies ? `Known Allergies: ${input.knownAllergies}` : '',
    input.currentMedications ? `Current Medications: ${input.currentMedications}` : '',
    `\nPatient History / Answers:\n${input.patientAnswers}`,
  ].filter(Boolean).join('\n');
}

async function callClaude(apiKey: string, input: ClinicalAiInput): Promise<string> {
  const body = {
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserMessage(input) }],
  };

  // Endpoint order:
  //   1. /api/anthropic/v1/messages — Vite dev proxy in development OR the
  //      Cloudflare Pages Function (functions/api/anthropic/[[path]].ts) in
  //      production. When the Function has ANTHROPIC_API_KEY set as a secret,
  //      the browser never sees the real key.
  //   2. https://api.anthropic.com/v1/messages — direct browser fallback for
  //      static-only hosts. Requires the user to supply a key in Settings.
  const endpoints = ['/api/anthropic/v1/messages', 'https://api.anthropic.com/v1/messages'];
  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      };
      // Only set x-api-key when we actually have one. The Cloudflare Function
      // injects the server-side key if this header is missing.
      if (apiKey) headers['x-api-key'] = apiKey;
      if (endpoint.startsWith('https://')) {
        headers['anthropic-dangerous-direct-browser-access'] = 'true';
        // Direct browser route REQUIRES the user to bring their own key.
        if (!apiKey) continue;
      }
      const res = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`API ${res.status}: ${err.slice(0, 200)}`);
      }
      const data = await res.json();
      return data.content?.[0]?.text ?? '';
    } catch (e) {
      lastError = e as Error;
    }
  }
  throw lastError ?? new Error('Clinical AI call failed');
}

export async function getClinicalSuggestions(
  apiKey: string,
  input: ClinicalAiInput
): Promise<ClinicalAiResponse> {
  const raw = await callClaude(apiKey, input);

  // Extract JSON block from response
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI returned non-JSON response');
  const parsed = JSON.parse(jsonMatch[0]) as Omit<ClinicalAiResponse, 'raw'>;

  return {
    differentials: parsed.differentials ?? [],
    urgency: parsed.urgency ?? 'routine',
    investigations: parsed.investigations ?? [],
    medications: parsed.medications ?? [],
    referrals: parsed.referrals ?? [],
    redFlags: parsed.redFlags ?? [],
    clinicalPearls: parsed.clinicalPearls ?? [],
    raw,
  };
}
