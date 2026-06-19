/**
 * Partner-side API adapter.
 *
 * Fetches ranked customers and cadence data from the Protection Coach Engine,
 * converting responses into frontend view models.
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

// ─── Backend response types (matches customers-ranked endpoint) ──

interface ApiCustomerRanked {
  customer_id: string;
  name: string;
  initials: string;
  protection_intelligence_score: number;
  opportunity_score: number;
  opportunity_breakdown: Record<string, number> | null;
  gapSummary: string;
  renewsInDays: number;
  why: string[];
  whyOpportunity: string;
  customerTip: string;
  score_breakdown: Array<{ key: string; name: string; score: number; max: number }>;
  coverage: Array<{ id: string; name: string; covered: boolean; source: string | null; icon: string }>;
  weak_spots: string[];
  top_gap: string;
}

interface CustomersRankedResponse {
  success: boolean;
  data: {
    customers_ranked: ApiCustomerRanked[];
    top_opportunity: string | null;
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

// ─── Constants ────────────────────────────────────────────────

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

const LESSON_ICONS: Record<string, string> = {
  hospital: '🏥',
  document: '📄',
  car: '🚗',
  shield: '🛡️',
  family: '👨\u200D👩\u200D👧\u200D👦',
  money: '💰',
};

// ─── Public API functions ─────────────────────────────────────

/**
 * Fetch all customers ranked by opportunity score.
 * Calls /api/v1/partner/all/customers-ranked (single-partner demo mode).
 */
export async function fetchPartnerIntelligence(_partnerId: string): Promise<{
  customers: Customer[];
  topOpportunity: string;
} | null> {
  try {
    const response = await fetch(`${API_BASE}/api/v1/partner/all/customers-ranked`);
    if (!response.ok) return null;

    const json = (await response.json()) as CustomersRankedResponse;
    if (!json.success || !json.data.customers_ranked.length) return null;

    return {
      customers: json.data.customers_ranked.map(toFrontendCustomer),
      topOpportunity: json.data.top_opportunity ?? json.data.customers_ranked[0].customer_id,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch partner contact info for a customer.
 */
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

/**
 * Fetch AI cadence data for partner's top opportunity.
 */
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

// ─── Helpers for StreakHome ────────────────────────────────────

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

// ─── Transform backend → frontend Customer ────────────────────

function toFrontendCustomer(customer: ApiCustomerRanked, index: number): Customer {
  return {
    customer_id: customer.customer_id,
    name: customer.name,
    initials: customer.initials,
    protection_intelligence_score: customer.protection_intelligence_score,
    opportunity_score: customer.opportunity_score,
    gapSummary: customer.gapSummary,
    avatarColors: AVATAR_PALETTES[index % AVATAR_PALETTES.length],
    renewsInDays: customer.renewsInDays,
    why: customer.why,
    whyOpportunity: customer.whyOpportunity,
    customerTip: customer.customerTip || '',
    score_breakdown: customer.score_breakdown as ScoreDimension[],
    coverage: customer.coverage as CoverageRow[],
    weak_spots: customer.weak_spots,
    top_gap: customer.top_gap,
  };
}
