import pool from '../../config/database';

export interface Recommendation {
  priority: number;        // 1 = highest
  product: string;         // health, term, life, etc.
  title: string;           // Short headline
  message: string;         // Personalized message for customer
  advisor_pitch: string;   // Talking point for advisor
  impact: string;          // How much PIS will improve
  urgency: 'high' | 'medium' | 'low';
}

/**
 * Generate personalized recommendations for a customer based on their
 * protection gaps, life stage, and financial situation.
 */
export async function getRecommendations(customerId: string): Promise<Recommendation[]> {
  const customer = (await pool.query(`SELECT * FROM customers WHERE id = $1`, [customerId])).rows[0];
  if (!customer) throw new Error(`Customer ${customerId} not found`);

  const recommendations: Recommendation[] = [];
  let priority = 1;

  // ─── Health Gap (highest priority if missing) ───────────────────
  if (!customer.health_cover) {
    const msg = customer.single_earner
      ? `As the sole earner for your family, a health emergency without insurance could wipe out your savings. A comprehensive health plan protects your family's financial stability.`
      : `Medical costs are rising 15% every year. Without health coverage, a single hospitalization could cost ₹3-5 lakhs out of pocket. Getting covered now locks in lower premiums.`;

    const advisorPitch = customer.renewal_due_days && customer.renewal_due_days < 30
      ? `Renewal in ${customer.renewal_due_days} days — perfect moment to bundle health. Customer is ${customer.marital_status?.toLowerCase()}, ${customer.dependents} dependents, no health cover. High conversion window.`
      : `Missing health cover. ${customer.single_earner ? 'Single earner' : 'Dual income'} household with ${customer.dependents} dependents. Clear need, pitch family floater.`;

    recommendations.push({
      priority: priority++,
      product: 'health',
      title: 'Get Health Insurance — Your Biggest Gap',
      message: msg,
      advisor_pitch: advisorPitch,
      impact: '+10 to +13 points on Protection Score',
      urgency: customer.renewal_due_days && customer.renewal_due_days < 30 ? 'high' : 'medium',
    });
  }

  // ─── Term Gap ───────────────────────────────────────────────────
  if (!customer.term_cover) {
    const children = customer.children || 0;
    const dependents = customer.dependents || 0;

    let msg: string;
    if (children > 0) {
      msg = `Your ${children} ${children === 1 ? 'child depends' : 'children depend'} on your income. A term plan of ₹${Math.round((customer.annual_income || 500000) * 10 / 100000)} lakhs ensures their education and future are protected even if something happens to you.`;
    } else if (customer.home_loan) {
      msg = `You have a home loan. If something unexpected happens, your family would need to keep up with EMIs. A term plan covers the outstanding loan amount and keeps them in their home.`;
    } else {
      msg = `Term insurance gives you the highest coverage at the lowest cost. At your age, locking in a term plan now means significantly lower premiums for 20-30 years of protection.`;
    }

    const advisorPitch = children > 0
      ? `${children} children, ${customer.single_earner ? 'single earner' : ''} — term is an emotional sell. Frame around children's education fund. Suggest ₹${Math.round((customer.annual_income || 500000) * 10 / 100000)} lakh cover.`
      : `Home loan of ₹${customer.existing_liabilities ? Math.round(customer.existing_liabilities / 100000) + ' lakhs' : 'significant amount'}. Position term as loan protection. Simple pitch.`;

    recommendations.push({
      priority: priority++,
      product: 'term',
      title: children > 0 ? "Protect Your Children's Future" : 'Secure Your Family with Term Cover',
      message: msg,
      advisor_pitch: advisorPitch,
      impact: '+8 to +15 points on Protection Score',
      urgency: children > 0 ? 'high' : 'medium',
    });
  }

  // ─── Life Gap ───────────────────────────────────────────────────
  if (!customer.life_cover) {
    recommendations.push({
      priority: priority++,
      product: 'life',
      title: 'Build Long-Term Wealth with Life Insurance',
      message: `A life insurance plan gives you dual benefits — protection for your family plus a savings component that builds wealth over time. It's especially valuable for retirement planning.`,
      advisor_pitch: `No life cover. Position as a savings + protection combo. Works well for customers thinking about retirement or wealth building. Endowment or ULIP depending on risk appetite.`,
      impact: '+7 points on Protection Score',
      urgency: 'low',
    });
  }

  // ─── Motor Gap ──────────────────────────────────────────────────
  if (!customer.motor_cover) {
    recommendations.push({
      priority: priority++,
      product: 'motor',
      title: 'Don\'t Drive Without Cover',
      message: `Motor insurance is legally required and protects you from accident liabilities. A comprehensive plan also covers theft, natural disasters, and third-party damage.`,
      advisor_pitch: `Missing motor cover — quick win, easy close. Legal requirement angle.`,
      impact: '+3 points on Protection Score',
      urgency: 'medium',
    });
  }

  // ─── Upgrade recommendation if already well-covered ─────────────
  if (customer.health_cover && customer.term_cover && customer.life_cover) {
    recommendations.push({
      priority: priority++,
      product: 'critical_illness',
      title: 'Add a Critical Illness Rider',
      message: `You're well protected! The next step is a critical illness cover that pays a lump sum on diagnosis of major illnesses like cancer or heart disease — on top of your health insurance.`,
      advisor_pitch: `Well-covered customer. Upsell opportunity with CI rider. Position as "the gap health insurance doesn't cover." Lump sum on diagnosis resonates well.`,
      impact: '+2 points (external policy recognition)',
      urgency: 'low',
    });
  }

  return recommendations;
}
