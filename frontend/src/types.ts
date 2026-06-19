export type CoverageSource = 'pb_held' | 'sold_by_agent' | 'added_by_agent' | null;

export interface ScoreDimension {
  key: string;
  name: string;
  score: number;
  max: number;
}

export interface CoverageRow {
  id: 'motor' | 'life' | 'health' | 'term';
  name: string;
  covered: boolean;
  source: CoverageSource;
  icon: string;
}

export interface Customer {
  customer_id: string;
  name: string;
  initials: string;
  protection_intelligence_score: number;
  opportunity_score: number;
  gapSummary: string;
  avatarColors: [string, string];
  renewsInDays: number;
  why: string[];
  whyOpportunity: string;
  score_breakdown: ScoreDimension[];
  coverage: CoverageRow[];
  weak_spots: string[];
  top_gap: string;
}

export interface AgentState {
  partner_id: string;
  name: string;
  email: string;
  streak_day: number;
  coins: number;
  top_percent: number;
  cross_sell_gap: { product: string; days_idle: number };
}

export interface CadenceMission {
  title: string;
  subtitle: string;
  action: string;
  tags: string[];
}

export type TabId = 'streak' | 'customers' | 'profile' | 'customer_pov';

export interface MissionItem {
  id: string;
  title: string;
  desc: string;
  coins: number;
  icon: 'sparkles' | 'users' | 'clipboard' | 'shield' | 'mail' | 'share' | 'refresh';
  urgent?: boolean;
}

export interface AiSlide {
  title: string;
  badge: string;
  text: string;
}
