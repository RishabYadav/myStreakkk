import { Customer } from '../types';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? 'http://localhost:3000';

export type TemplateApiKey = 1 | 2 | 3;

export interface TemplateVariables {
  partnerName: string;
  protectionScore: number;
  scoreLabel: 'Poor' | 'Fair' | 'Good';
  currentDate: string;
  insightText: string;
}

export interface TemplateContent {
  headline: string;
  caption: string;
  cta: string;
  hashtags: string[];
}

export interface TemplatePosterImage {
  mimeType: string;
  dataBase64: string;
}

export interface TemplateResult {
  key: number;
  partnerCode: string;
  variables: TemplateVariables;
  content: TemplateContent;
  posterImage: TemplatePosterImage | null;
  posterError: string | null;
  isBirthdayToday: boolean;
}

interface RawShareableContent {
  headline: string;
  caption: string;
  cta: string;
  hashtags: string[];
  image_heading?: string;
  image_quote?: string;
  image_prompt?: string;
}

interface RawPosterImage {
  mime_type: string;
  data_base64: string;
}

interface RawGenerateContentResponse {
  key: number;
  partner_code: string;
  is_birthday_today: boolean;
  content: RawShareableContent;
  poster_image?: RawPosterImage | null;
  poster_error?: string | null;
}

interface ApiEnvelope {
  success: boolean;
  data: RawGenerateContentResponse;
  error?: string;
}

export function formatTemplateDate(date = new Date()): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function scoreLabelFor(score: number): TemplateVariables['scoreLabel'] {
  if (score <= 39) return 'Poor';
  if (score <= 69) return 'Fair';
  return 'Good';
}

export function insightTextForCustomer(customer: Customer): string {
  const score = customer.protection_intelligence_score;
  if (score >= 84) return 'Excellent protection profile achieved!';
  if (score >= 75) return 'Term coverage gaps hold you back';
  return 'Health & term gaps hold you back';
}

/** UI section id → backend API key (greetings id=2 → greeting key=2). */
export function getSectionApiKey(sectionId: number): TemplateApiKey | null {
  if (sectionId === 2) return 2;
  if (sectionId === 3 || sectionId === 4) return 3;
  return null;
}

export function buildScoreCardPayload(customer: Customer, currentDate = formatTemplateDate()) {
  const partnerName = customer.name.split(' ')[0];
  return {
    key: 3 as const,
    partner_code: customer.customer_id,
    partner_name: partnerName,
    protectionScore: customer.protection_intelligence_score,
    insight_text: insightTextForCustomer(customer),
    current_date: currentDate,
  };
}

export function buildGreetingPayload(customer: Customer) {
  const partnerName = customer.name.split(' ')[0];
  return {
    key: 2 as const,
    partner_code: customer.customer_id,
    partner_name: partnerName,
    partner_group: customer.partner_group ?? 'Health',
    partner_dob: customer.date_of_birth ?? '1990-05-15',
    include_poster: true,
  };
}

function mapResponse(raw: RawGenerateContentResponse, insightText: string): TemplateResult {
  const protectionScore = raw.key === 3 ? extractScoreFromHeadline(raw.content.headline) : 0;
  const partnerName =
    raw.content.headline.match(/^(.+?)'s Protection Score/)?.[1] ??
    raw.content.caption.split(' ')[0] ??
    '';

  return {
    key: raw.key,
    partnerCode: raw.partner_code,
    variables: {
      partnerName: partnerName || 'Partner',
      protectionScore,
      scoreLabel: scoreLabelFor(protectionScore),
      currentDate: formatTemplateDate(),
      insightText,
    },
    content: {
      headline: raw.content.headline,
      caption: raw.content.caption,
      cta: raw.content.cta,
      hashtags: raw.content.hashtags,
    },
    posterImage: raw.poster_image
      ? {
          mimeType: raw.poster_image.mime_type,
          dataBase64: raw.poster_image.data_base64,
        }
      : null,
    posterError: raw.poster_error ?? null,
    isBirthdayToday: raw.is_birthday_today,
  };
}

function extractScoreFromHeadline(headline: string): number {
  const match = headline.match(/:\s*(\d+)/);
  return match ? Number.parseInt(match[1], 10) : 0;
}

export async function fetchRecommendedTemplate(
  payload: ReturnType<typeof buildScoreCardPayload> | ReturnType<typeof buildGreetingPayload>
): Promise<TemplateResult> {
  const insightText =
    'insight_text' in payload && payload.insight_text
      ? payload.insight_text
      : insightTextForCustomer({
          name: payload.partner_name,
          protection_intelligence_score:
            'protectionScore' in payload ? payload.protectionScore : 0,
        } as Customer);

  const res = await fetch(`${API_BASE}/api/v1/llm/get-recommand-template`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const body = (await res.json()) as ApiEnvelope;

  if (!res.ok || !body.success) {
    throw new Error(body.error ?? `Template request failed (${res.status})`);
  }

  const mapped = mapResponse(body.data, insightText);

  if (payload.key === 3 && 'protectionScore' in payload) {
    mapped.variables = {
      partnerName: payload.partner_name,
      protectionScore: payload.protectionScore,
      scoreLabel: scoreLabelFor(payload.protectionScore),
      currentDate: payload.current_date ?? formatTemplateDate(),
      insightText: payload.insight_text,
    };
  }

  if (payload.key === 1 || payload.key === 2) {
    mapped.variables = {
      partnerName: payload.partner_name,
      protectionScore: 0,
      scoreLabel: 'Fair',
      currentDate: formatTemplateDate(),
      insightText,
    };
  }

  return mapped;
}

export function buildTemplatePayload(
  sectionId: number,
  customer: Customer
): ReturnType<typeof buildScoreCardPayload> | ReturnType<typeof buildGreetingPayload> | null {
  const apiKey = getSectionApiKey(sectionId);
  if (apiKey === 1 || apiKey === 2) return buildGreetingPayload(customer);
  if (apiKey === 3) return buildScoreCardPayload(customer);
  return null;
}
