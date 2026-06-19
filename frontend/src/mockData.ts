import { AgentState, CadenceMission, Customer } from './types';

/** Partner Intelligence (Dev 1) */
export const PARTNER_INTELLIGENCE = {
  partner_id: 'P1024',
  name: 'Rahul Sharma',
  streak_day: 31,
  cross_sell_gap: { product: 'Health', days_idle: 18 },
  customers_ranked: [
    {
      customer_id: 'C5501',
      name: 'Anjali Mehta',
      protection_intelligence_score: 62,
      opportunity_score: 89,
      why: [
        'Motor renewal due in 9 days',
        'Health protection missing with two dependents',
        'Sole earning member with home loan outstanding',
        'High historical conversion likelihood for this profile',
      ],
    },
    {
      customer_id: 'C5502',
      name: 'Rohit Verma',
      protection_intelligence_score: 45,
      opportunity_score: 46,
    },
    {
      customer_id: 'C5503',
      name: 'Priya Nair',
      protection_intelligence_score: 84,
      opportunity_score: 41,
    },
  ],
  top_opportunity: 'C5501',
};

/** Cadence AI Output (Dev 3) */
export const CADENCE_AI = {
  coach_tip:
    "Anjali has two dependents, a home loan, and is the sole earner. Her renewal is due in 9 days and she has no health protection. She is your highest-impact action today.",
  mission: {
    title: "Protect Anjali's Family Health",
    subtitle: 'Score 62 · renews in 9 days · highest-converting match',
    action: 'Book a Health policy for Anjali Mehta',
    tags: ['Health', 'Booking', '2× coins'],
  } as CadenceMission,
  talking_points: [
    'Anjali, your motor policy renews in 9 days — great time to review your full protection.',
    'You have two children and a home loan but no health cover.',
    'A health plan today protects your family and your EMIs.',
  ],
  lesson_recommendations: [
    {
      priority: true,
      icon: '🏥',
      title: 'Health is her biggest gap',
      body: 'One hospital stay can erase years of savings.',
    },
    {
      priority: true,
      icon: '📄',
      title: "Term protects her family's income",
      body: 'The cheapest cover per rupee protected.',
    },
    {
      priority: false,
      icon: '🚗',
      title: 'Check her motor for zero-dep',
      body: 'Zero-dep can change a claim by thousands.',
    },
  ],
};

/** Protection Intelligence (Dev 2) — Anjali starting state */
export const ANJALI_PROTECTION = {
  customer_id: 'C5501',
  name: 'Anjali Mehta',
  protection_intelligence_score: 62,
  score_breakdown: {
    coverage_adequacy: { score: 12, max: 30 },
    life_stage_readiness: { score: 8, max: 15 },
    financial_vulnerability: { score: 7, max: 15 },
    family_risk_protection: { score: 5, max: 10 },
    protection_freshness: { score: 8, max: 10 },
    engagement_strength: { score: 10, max: 10 },
    data_confidence: { score: 6, max: 10 },
  },
  coverage: {
    motor: { covered: true, source: 'pb_held' as const },
    life: { covered: true, source: 'pb_held' as const },
    health: { covered: false, source: null },
    term: { covered: false, source: null },
  },
  weak_spots: ['health', 'term'],
  top_gap: 'health',
};

const BREAKDOWN_LABELS: Record<string, string> = {
  coverage_adequacy: 'Coverage Adequacy',
  life_stage_readiness: 'Life Stage Readiness',
  financial_vulnerability: 'Financial Vulnerability',
  family_risk_protection: 'Family Risk Protection',
  protection_freshness: 'Protection Freshness',
  engagement_strength: 'Engagement Strength',
  data_confidence: 'Data Confidence',
};

function buildAnjaliCustomer(): Customer {
  const bd = ANJALI_PROTECTION.score_breakdown;
  return {
    customer_id: 'C5501',
    name: 'Anjali Mehta',
    initials: 'AM',
    protection_intelligence_score: 62,
    opportunity_score: 89,
    gapSummary: 'Health gap · Motor renews in 9 days',
    avatarColors: ['#F8D26A', '#E89B17'],
    renewsInDays: 9,
    why: PARTNER_INTELLIGENCE.customers_ranked[0].why ?? [],
    whyOpportunity:
      'Anjali holds active PB-issued Motor and Life policies. However, she has zero health coverage with PBPartners. With her Motor policy renewing in 9 days, she has peak touchpoint affinity.',
    customerTip: 'Your family depends on your income, but you have no health cover. Adding a family floater now protects everyone and could save you 15% with a combo bundle.',
    score_breakdown: Object.entries(bd).map(([key, val]) => ({
      key,
      name: BREAKDOWN_LABELS[key] ?? key,
      score: val.score,
      max: val.max,
    })),
    coverage: [
      { id: 'motor', name: 'Motor', covered: true, source: 'pb_held', icon: '🚗' },
      { id: 'life', name: 'Life', covered: true, source: 'pb_held', icon: '🧬' },
      { id: 'health', name: 'Health', covered: false, source: null, icon: '🏥' },
      { id: 'term', name: 'Term', covered: false, source: null, icon: '📄' },
    ],
    weak_spots: ['health', 'term'],
    top_gap: 'health',
    date_of_birth: '1985-03-12',
    partner_group: 'Health',
  };
}

function buildOtherCustomer(
  id: string,
  name: string,
  pis: number,
  os: number,
  gap: string,
  colors: [string, string]
): Customer {
  return {
    customer_id: id,
    name,
    initials: name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2),
    protection_intelligence_score: pis,
    opportunity_score: os,
    gapSummary: gap,
    avatarColors: colors,
    renewsInDays: 45,
    why: [],
    whyOpportunity: `${name} has protection gaps worth reviewing with your AI coach.`,
    customerTip: 'Maintain verified covers to keep your protection index strong.',
    score_breakdown: [
      { key: 'coverage_adequacy', name: 'Coverage Adequacy', score: Math.round(pis * 0.3), max: 30 },
      { key: 'life_stage_readiness', name: 'Life Stage Readiness', score: 8, max: 15 },
      { key: 'financial_vulnerability', name: 'Financial Vulnerability', score: 7, max: 15 },
      { key: 'family_risk_protection', name: 'Family Risk Protection', score: 5, max: 10 },
      { key: 'protection_freshness', name: 'Protection Freshness', score: 8, max: 10 },
      { key: 'engagement_strength', name: 'Engagement Strength', score: 6, max: 10 },
      { key: 'data_confidence', name: 'Data Confidence', score: 6, max: 10 },
    ],
    coverage: [
      { id: 'motor', name: 'Motor', covered: pis > 50, source: 'pb_held', icon: '🚗' },
      { id: 'life', name: 'Life', covered: pis > 40, source: 'pb_held', icon: '🧬' },
      { id: 'health', name: 'Health', covered: pis > 70, source: null, icon: '🏥' },
      { id: 'term', name: 'Term', covered: pis > 80, source: null, icon: '📄' },
    ],
    weak_spots: ['health'],
    top_gap: 'health',
  };
}

export const INITIAL_AGENT: AgentState = {
  partner_id: 'P001',
  name: PARTNER_INTELLIGENCE.name,
  email: 'rahul.sharma@pbpartners.com',
  streak_day: PARTNER_INTELLIGENCE.streak_day,
  coins: 0,
  top_percent: 12,
  cross_sell_gap: PARTNER_INTELLIGENCE.cross_sell_gap,
};

export const AI_SLIDES = [
  {
    title: 'Critical Health Gap',
    badge: 'Score: 62 → 75',
    text: 'Anjali Mehta has zero health policies registered under PBPartners. Cross-sell a combined health floater family package to double your daily streak multiplier.',
  },
  {
    title: 'Motor Cycle Continuity',
    badge: 'Touchpoint Focus',
    text: "Anjali's private car policy is due for renewal in 9 days. Contacting her now creates a high-trust affinity window to discuss combined healthcare riders.",
  },
  {
    title: 'Tax Exemption Claim',
    badge: 'Financial Nudge',
    text: 'Present HDFC Ergo Family Floater quotes highlighting direct Section 80D tax deductions. Clients save money on premium bundles with top claims ratios.',
  },
];

export const ACTIVE_MISSIONS = [
  {
    id: 'ai-combo',
    title: 'Pitch Health Top-up Combo',
    desc: "Match Anjali's coverage gaps with a premium rise",
    coins: 500,
    icon: 'sparkles' as const,
    urgent: true,
  },
  {
    id: 'create-lead',
    title: 'Create a Client Lead',
    desc: 'Register a new prospect profile to the client zone list',
    coins: 100,
    icon: 'users' as const,
    urgent: false,
  },
  {
    id: 'book-policy',
    title: 'Book a Policy Record',
    desc: 'Confirm active premium contract file alignment',
    coins: 200,
    icon: 'clipboard' as const,
    urgent: false,
  },
];

export const FALLBACK_MISSIONS = [
  {
    id: 'verify-kyc',
    title: 'Validate Client KYC documents',
    desc: 'Compare Aadhaar & PAN details to protect policy cadence',
    coins: 150,
    icon: 'shield' as const,
    urgent: false,
  },
  {
    id: 'nudge-renewals',
    title: 'Nudge Lapsed Motor policy',
    desc: 'Ping WhatsApp renewal notice to 2 dormant accounts',
    coins: 120,
    icon: 'mail' as const,
    urgent: false,
  },
  {
    id: 'share-wellness',
    title: 'Share Health Campaign Asset',
    desc: 'Post PBPartners official cardiac advisory to client circle',
    coins: 100,
    icon: 'share' as const,
    urgent: false,
  },
  {
    id: 'cleanup-leads',
    title: 'Purge Stale Outreaches',
    desc: 'Archive cold sales profiles older than 60 days to reset focus',
    coins: 80,
    icon: 'refresh' as const,
    urgent: false,
  },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  buildAnjaliCustomer(),
  buildOtherCustomer(
    'C5502',
    'Rohit Verma',
    45,
    46,
    'Term validation needed — last contact 45 days ago',
    ['#818CF8', '#1B2A6B']
  ),
  buildOtherCustomer(
    'C5503',
    'Priya Nair',
    84,
    41,
    'All standard covers active — suggest add-ons',
    ['#34D399', '#0FB67E']
  ),
];

export const GENERIC_MISSIONS = [
  { id: 'lead', title: 'Create a new lead', subtitle: 'Register a prospect to your client zone', coins: 100 },
  { id: 'visit', title: 'Log a client visit', subtitle: 'Record an in-person meeting with a customer', coins: 80 },
];

/** Score states after demo events */
export const SCORE_AFTER_BOOKING = 75;
export const SCORE_AFTER_QUESTIONNAIRE = 84;

export function getBookingBreakdown(base: Customer['score_breakdown']): Customer['score_breakdown'] {
  return base.map((row) => {
    if (row.key === 'coverage_adequacy') return { ...row, score: 18 };
    if (row.key === 'family_risk_protection') return { ...row, score: 8 };
    return row;
  });
}

export function getEnrichedBreakdown(base: Customer['score_breakdown']): Customer['score_breakdown'] {
  return getBookingBreakdown(base).map((row) => {
    if (row.key === 'coverage_adequacy') return { ...row, score: 22 };
    if (row.key === 'data_confidence') return { ...row, score: 9 };
    if (row.key === 'family_risk_protection') return { ...row, score: 9 };
    return row;
  });
}
