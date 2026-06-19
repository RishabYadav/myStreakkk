/**
 * Customer API service — fetches real data from the Protection Coach Engine backend.
 * Falls back gracefully so the app still works offline with mocks.
 */

import { Customer, CoverageRow, ScoreDimension } from '../types';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? 'http://localhost:3000';

// ─── Types matching backend response ──────────────────────────

interface ApiCustomerRanked {
  customer_id: string;
  name: string;
  initials: string;
  protection_intelligence_score: number;
  opportunity_score: number;
  opportunity_breakdown: Record<string, number>;
  gapSummary: string;
  renewsInDays: number;
  why: string[];
  whyOpportunity: string;
  score_breakdown: ScoreDimension[];
  coverage: CoverageRow[];
  weak_spots: string[];
  top_gap: string;
}

interface RankedResponse {
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

export interface Recommendation {
  priority: number;
  product: string;
  title: string;
  message: string;
  advisor_pitch: string;
  impact: string;
  urgency: 'high' | 'medium' | 'low';
}

interface FullProfileData extends ApiCustomerRanked {
  recommendations: Recommendation[];
  talking_points: string[];
  lesson_recommendations: LessonRecommendation[];
}

interface FullProfileResponse {
  success: boolean;
  data: FullProfileData;
}

// ─── Color palette for avatar generation ──────────────────────

const AVATAR_PALETTES: [string, string][] = [
  ['#F8D26A', '#E89B17'],
  ['#818CF8', '#1B2A6B'],
  ['#34D399', '#0FB67E'],
  ['#FB923C', '#C2410C'],
  ['#A78BFA', '#6D28D9'],
  ['#F472B6', '#BE185D'],
  ['#38BDF8', '#0369A1'],
  ['#FCD34D', '#B45309'],
  ['#6EE7B7', '#047857'],
  ['#F87171', '#B91C1C'],
];

function getAvatarColors(index: number): [string, string] {
  return AVATAR_PALETTES[index % AVATAR_PALETTES.length];
}

// ─── Transform API response to frontend Customer type ─────────

function apiCustomerToFrontend(c: ApiCustomerRanked, index: number): Customer {
  return {
    customer_id: c.customer_id,
    name: c.name,
    initials: c.initials,
    protection_intelligence_score: c.protection_intelligence_score,
    opportunity_score: c.opportunity_score,
    gapSummary: c.gapSummary,
    avatarColors: getAvatarColors(index),
    renewsInDays: c.renewsInDays,
    why: c.why,
    whyOpportunity: c.whyOpportunity,
    score_breakdown: c.score_breakdown,
    coverage: c.coverage,
    weak_spots: c.weak_spots,
    top_gap: c.top_gap,
  };
}

// ─── Public API functions ─────────────────────────────────────

/**
 * Fetch all customers ranked by opportunity score.
 * Uses partnerId = "P001" for the single-partner demo.
 * Returns null if the API is unreachable (caller should fall back to mocks).
 */
export async function fetchCustomersRanked(): Promise<{
  customers: Customer[];
  topOpportunity: string | null;
} | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/partner/all/customers-ranked`);
    if (!res.ok) return null;

    const json: RankedResponse = await res.json();
    if (!json.success || !json.data.customers_ranked.length) return null;

    const customers = json.data.customers_ranked.map((c, i) => apiCustomerToFrontend(c, i));

    return {
      customers,
      topOpportunity: json.data.top_opportunity,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch a single customer's full profile (for CustomerFile screen).
 * Returns null if the API is unreachable.
 */
export async function fetchCustomerFullProfile(customerId: string): Promise<{
  customer: Customer;
  recommendations: Recommendation[];
  talking_points: string[];
  lesson_recommendations: LessonRecommendation[];
} | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/customer/${customerId}/full-profile`);
    if (!res.ok) return null;

    const json: FullProfileResponse = await res.json();
    if (!json.success) return null;

    const d = json.data;
    const customer: Customer = {
      customer_id: d.customer_id,
      name: d.name,
      initials: d.initials,
      protection_intelligence_score: d.protection_intelligence_score,
      opportunity_score: d.opportunity_score,
      gapSummary: d.gapSummary,
      avatarColors: getAvatarColors(0), // will be overridden by list color
      renewsInDays: d.renewsInDays,
      why: d.why,
      whyOpportunity: d.whyOpportunity,
      score_breakdown: d.score_breakdown,
      coverage: d.coverage,
      weak_spots: d.weak_spots,
      top_gap: d.top_gap,
    };

    return {
      customer,
      recommendations: d.recommendations,
      talking_points: d.talking_points,
      lesson_recommendations: d.lesson_recommendations,
    };
  } catch {
    return null;
  }
}

/**
 * Report a coverage event (booking or enrichment) to the backend.
 * Returns the updated scores or null on failure.
 */
export async function reportCoverageEvent(
  customerId: string,
  product: 'health' | 'term' | 'life' | 'motor',
  source: 'sold_by_agent' | 'added_by_agent' | 'pb_held'
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/coverage-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: customerId, product, source }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
