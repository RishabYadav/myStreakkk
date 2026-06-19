/**
 * Partner-side API adapter.
 *
 * Converts Partner Intelligence and Cadence responses into the existing
 * frontend view models so screens do not need backend-specific logic.
 */

import {
  AiSlide,
  CadenceMission,
  CoverageRow,
  Customer,
  MissionItem,
  ScoreDimension,
} from '../types';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? 'http://localhost:3000';

interface ApiScoreDimension {
  score: number;
  max: number;
}

interface ApiPartnerCustomer {
  customer_id: string;
  name: string;
  protection_intelligence_score: number | null;
  protection_breakdown: Record<string, ApiScoreDimension> | null;
  opportunity_score: number;
  opportunity_breakdown: Record<string, number> | null;
  coverage: {
    health: boolean;
    term: boolean;
    life: boolean;
    motor: boolean;
  };
  why: string[];
}

interface PartnerIntelligenceResponse {
  success: boolean;
  data: {
    partner_id: string;
    customers_ranked: ApiPartnerCustomer[];
    top_opportunity: string;
  };
}

export interface LessonRecommendation {
  priority: boolean;
  icon: string;
  title: string;
  body: string;
}

export interface CadenceData {
  partner_id: string;
  customer_id: string;
  opportunity_score: number;
  why: string[];
  coach_tip: string;
  whatsapp_message: string;
  mission: CadenceMission;
  talking_points: string[];
  lesson_recommendations: LessonRecommendation[];
  meta: {
    source: 'cache' | 'gemini';
    stale: boolean;
    model: string;
    generated_at: string;
  };
}

interface CadenceResponse {
  success: boolean;
  data: CadenceData;
}

export interface PartnerContact {
  customer_id: string;
  name: string;
  phone: string;
}

interface PartnerContactResponse {
  success: boolean;
  data: PartnerContact;
}

const BREAKDOWN_LABELS: Record<string, string> = {
  coverage_adequacy: 'Coverage Adequacy',
  life_stage_readiness: 'Life Stage Readiness',
  financial_vulnerability: 'Financial Vulnerability',
  family_risk_protection: 'Family Risk Protection',
  protection_freshness: 'Protection Freshness',
  engagement_strength: 'Engagement Strength',
  data_confidence: 'Data Confidence',
};

const COVERAGE_META: Record<CoverageRow['id'], { name: string; icon: string }> = {
  motor: { name: 'Motor', icon: '🚗' },
  life: { name: 'Life', icon: '🧬' },
  health: { name: 'Health', icon: '🏥' },
  term: { name: 'Term', icon: '📄' },
};

const LESSON_ICONS: Record<string, string> = {
  hospital: '🏥',
  document: '📄',
  car: '🚗',
  shield: '🛡️',
  family: '👨‍👩‍👧‍👦',
  money: '💰',
};

const AVATAR_PALETTES: [string, string][] = [
  ['#F8D26A', '#E89B17'],
  ['#818CF8', '#1B2A6B'],
  ['#34D399', '#0FB67E'],
  ['#FB923C', '#C2410C'],
  ['#A78BFA', '#6D28D9'],
  ['#F472B6', '#BE185D'],
  ['#38BDF8', '#0369A1'],
  ['#FCD34D', '#B45309'],
];

export async function fetchPartnerIntelligence(partnerId: string): Promise<{
  customers: Customer[];
  topOpportunity: string;
} | null> {
  try {
    const response = await fetch(
      `${API_BASE}/api/v1/partner/${encodeURIComponent(partnerId)}/intelligence`
    );
    if (!response.ok) return null;

    const json = (await response.json()) as PartnerIntelligenceResponse;
    if (!json.success || !json.data.customers_ranked.length) return null;

    return {
      customers: json.data.customers_ranked.map(toFrontendCustomer),
      topOpportunity: json.data.top_opportunity,
    };
  } catch {
    return null;
  }
}

export async function fetchPartnerContact(
  partnerId: string,
  customerId: string
): Promise<PartnerContact | null> {
  try {
    const response = await fetch(
      `${API_BASE}/api/v1/partner/${encodeURIComponent(partnerId)}/customer/${encodeURIComponent(customerId)}/contact`
    );
    if (!response.ok) return null;
    const json = (await response.json()) as PartnerContactResponse;
    return json.success && json.data?.phone ? json.data : null;
  } catch {
    return null;
  }
}

export async function fetchCadence(
  partnerId: string,
  customerId?: string,
  forceRefresh = false
): Promise<CadenceData | null> {
  try {
    const response = await fetch(`${API_BASE}/api/v1/cadence/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partner_id: partnerId,
        ...(customerId ? { customer_id: customerId } : {}),
        ...(forceRefresh ? { force_refresh: true } : {}),
      }),
    });
    if (!response.ok) return null;

    const json = (await response.json()) as CadenceResponse;
    if (!json.success || !json.data?.mission) return null;

    return {
      ...json.data,
      lesson_recommendations: json.data.lesson_recommendations.map((lesson) => ({
        ...lesson,
        icon: LESSON_ICONS[lesson.icon] ?? lesson.icon,
      })),
    };
  } catch {
    return null;
  }
}

export function cadenceToMission(cadence: CadenceData): MissionItem {
  return {
    id: 'ai-combo',
    title: cadence.mission.title,
    desc: cadence.mission.action || cadence.mission.subtitle,
    coins: 500,
    icon: 'sparkles',
    urgent: true,
  };
}

export function cadenceToInsights(cadence: CadenceData): AiSlide[] {
  return cadence.lesson_recommendations.map((lesson) => ({
    title: lesson.title,
    badge: lesson.priority ? 'Priority insight' : 'Advisor insight',
    text: lesson.body,
    icon: lesson.icon,
  }));
}

function toFrontendCustomer(customer: ApiPartnerCustomer, index: number): Customer {
  const products: CoverageRow['id'][] = ['health', 'term', 'life', 'motor'];
  const missingProducts = products.filter((product) => !customer.coverage[product]);
  const renewalDays = extractRenewalDays(customer.why);
  const topGap = missingProducts[0] ?? 'none';

  return {
    customer_id: customer.customer_id,
    name: customer.name,
    initials: customer.name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
    protection_intelligence_score: customer.protection_intelligence_score ?? 0,
    opportunity_score: customer.opportunity_score,
    gapSummary: buildGapSummary(missingProducts, renewalDays),
    avatarColors: AVATAR_PALETTES[index % AVATAR_PALETTES.length],
    renewsInDays: renewalDays ?? 0,
    why: customer.why,
    whyOpportunity: customer.why.join(' · '),
    customerTip: customer.why[0] ?? 'Review this customer’s current protection profile.',
    score_breakdown: toScoreBreakdown(customer.protection_breakdown),
    coverage: (['motor', 'life', 'health', 'term'] as CoverageRow['id'][]).map(
      (product) => ({
        id: product,
        name: COVERAGE_META[product].name,
        icon: COVERAGE_META[product].icon,
        covered: customer.coverage[product],
        source: customer.coverage[product] ? 'pb_held' : null,
      })
    ),
    weak_spots: missingProducts,
    top_gap: topGap,
  };
}

function toScoreBreakdown(
  breakdown: Record<string, ApiScoreDimension> | null
): ScoreDimension[] {
  if (!breakdown) return [];
  return Object.entries(breakdown).map(([key, value]) => ({
    key,
    name: BREAKDOWN_LABELS[key] ?? key.replace(/_/g, ' '),
    score: value.score,
    max: value.max,
  }));
}

function extractRenewalDays(why: string[]): number | null {
  for (const reason of why) {
    const match = reason.match(/renewal.+?(\d+)\s+day/i);
    if (match) return Number(match[1]);
  }
  return null;
}

function buildGapSummary(
  missingProducts: CoverageRow['id'][],
  renewalDays: number | null
): string {
  const gapText = missingProducts.length
    ? `${missingProducts.map(capitalize).join(' & ')} gap`
    : 'Core covers active';
  return renewalDays !== null ? `${gapText} · renews in ${renewalDays} days` : gapText;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
