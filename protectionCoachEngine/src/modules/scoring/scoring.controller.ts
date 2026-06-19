import { Request, Response, NextFunction } from 'express';
import pool from '../../config/database';
import { calculateProtectionScore } from './engines/protection-score.engine';
import { calculateOpportunityScore } from './engines/opportunity-score.engine';
import { getRecommendations as getRecsEngine } from './recommendations.engine';
import { runSimulation as runSimEngine } from './engines/risk-simulation.engine';
import { emitEvent } from '../events/event-bus';
import { getInsights, getCachedInsights } from './insights-generator';

/**
 * GET /api/v1/customer/:customerId/protection
 * Returns the full PIS response
 */
export async function getProtectionScore(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = req.params.customerId as string;

    // Always compute fresh to ensure consistency
    const result = await calculateProtectionScore(customerId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/customer/:customerId/opportunity
 * Returns OS and breakdown for one customer
 */
export async function getOpportunityScore(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = req.params.customerId as string;
    const result = await calculateOpportunityScore(customerId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/customer/:customerId/recommendations
 * Returns personalized product recommendations based on gaps
 */
export async function getRecommendations(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = req.params.customerId as string;
    const recommendations = await getRecsEngine(customerId);
    res.json({ success: true, data: recommendations });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/customer/:customerId/both
 * Returns both PIS and OS
 */
export async function getBothScores(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = req.params.customerId as string;

    const [protection, opportunity] = await Promise.all([
      calculateProtectionScore(customerId),
      calculateOpportunityScore(customerId),
    ]);

    res.json({ success: true, data: { protection, opportunity } });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/customer/:customerId/history
 * Returns score history
 */
export async function getScoreHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = req.params.customerId as string;
    const scoreType = req.query.type as string;
    const limit = parseInt(req.query.limit as string) || 20;

    let query = `SELECT * FROM score_histories WHERE customer_id = $1`;
    const values: any[] = [customerId];

    if (scoreType) {
      query += ` AND score_type = $2`;
      values.push(scoreType);
    }

    query += ` ORDER BY calculated_at DESC LIMIT $${values.length + 1}`;
    values.push(limit);

    const result = await pool.query(query, values);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/coverage-event
 * Body: { customer_id, product, source }
 * On receipt: update the customer's coverage state, recompute PIS, return full updated response
 * Source values: pb_held, sold_by_agent, added_by_agent
 */
export async function handleCoverageEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const { customer_id, product, source } = req.body;

    if (!customer_id || !product || !source) {
      res.status(400).json({ success: false, error: 'customer_id, product, and source are required' });
      return;
    }

    // Map product to column name
    const productColumnMap: Record<string, string> = {
      health: 'health_cover',
      term: 'term_cover',
      life: 'life_cover',
      motor: 'motor_cover',
    };

    const column = productColumnMap[product.toLowerCase()];
    if (!column) {
      res.status(400).json({ success: false, error: 'Invalid product. Use: health, term, life, motor' });
      return;
    }

    // Update coverage flag
    await pool.query(`UPDATE customers SET ${column} = true WHERE id = $1`, [customer_id]);

    // Update coverage_source JSON
    const customerResult = await pool.query(`SELECT coverage_source FROM customers WHERE id = $1`, [customer_id]);
    const currentSource = customerResult.rows[0]?.coverage_source || {};
    currentSource[product.toLowerCase()] = source;
    await pool.query(`UPDATE customers SET coverage_source = $1 WHERE id = $2`, [JSON.stringify(currentSource), customer_id]);

    // If source is 'added_by_agent', increment external_policies
    if (source === 'added_by_agent') {
      await pool.query(`UPDATE customers SET external_policies = external_policies + 1 WHERE id = $1`, [customer_id]);
    }

    // Emit domain event
    const eventType = source === 'sold_by_agent' ? 'POLICY_CREATED' : 'POLICY_UPDATED';
    await emitEvent({
      customer_id,
      event_type: eventType,
      payload: { product, source },
    });

    // Recompute PIS and return
    const pisResult = await calculateProtectionScore(customer_id);
    // Also recompute OS since coverage changed
    const osResult = await calculateOpportunityScore(customer_id);

    res.json({
      success: true,
      data: {
        protection: pisResult,
        opportunity: osResult,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/partner/:partnerId/customers-ranked
 * Returns all customers ranked by OS descending with full UI-ready data.
 * Use partnerId = "all" to fetch every customer (single-partner demo mode).
 */
export async function getCustomersRanked(req: Request, res: Response, next: NextFunction) {
  try {
    const partnerId = req.params.partnerId as string;

    // "all" bypasses partner filter for the single-partner demo
    const customersResult = partnerId === 'all'
      ? await pool.query(`SELECT * FROM customers ORDER BY created_at`)
      : await pool.query(
          `SELECT * FROM customers WHERE partner_id = $1 ORDER BY created_at`,
          [partnerId]
        );

    if (customersResult.rows.length === 0) {
      res.json({ success: true, data: { customers_ranked: [], top_opportunity: null } });
      return;
    }

    // Calculate scores and build full UI payload for each customer
    const ranked: any[] = [];
    for (const customer of customersResult.rows) {
      const pis = await calculateProtectionScore(customer.id);
      const os = await calculateOpportunityScore(customer.id);

      // Gap summary one-liner
      const gaps: string[] = [];
      if (!customer.health_cover) gaps.push('Health gap');
      if (!customer.term_cover) gaps.push('Term gap');
      if (!customer.life_cover) gaps.push('Life gap');
      if (customer.renewal_due_days != null && customer.renewal_due_days < 30) {
        gaps.push(`Renews in ${customer.renewal_due_days} days`);
      }
      const gapSummary = gaps.length > 0 ? gaps.join(' · ') : 'All standard covers active';

      // Why reasons list
      const why: string[] = [];
      if (customer.renewal_due_days != null && customer.renewal_due_days < 30)
        why.push(`Renewal due in ${customer.renewal_due_days} days`);
      if (!customer.health_cover && (customer.dependents || 0) >= 1)
        why.push(`Health protection missing with ${customer.dependents} dependents`);
      if (customer.single_earner)
        why.push('Sole earning member');
      if (customer.home_loan)
        why.push('Home loan outstanding');
      if (os.opportunity_score >= 70)
        why.push('High conversion likelihood for this profile');

      // whyOpportunity prose
      const coveredProducts: string[] = [];
      if (customer.motor_cover) coveredProducts.push('Motor');
      if (customer.life_cover) coveredProducts.push('Life');
      if (customer.health_cover) coveredProducts.push('Health');
      if (customer.term_cover) coveredProducts.push('Term');
      const missingProducts: string[] = [];
      if (!customer.health_cover) missingProducts.push('health');
      if (!customer.term_cover) missingProducts.push('term');
      if (!customer.life_cover) missingProducts.push('life');

      let whyOpportunity: string;
      // Prefer AI-generated whyOpportunity from cache
      const cachedInsights = await getCachedInsights(customer.id);
      if (cachedInsights?.why_opportunity) {
        whyOpportunity = cachedInsights.why_opportunity;
      } else if (missingProducts.length === 0) {
        whyOpportunity = `${customer.first_name} has comprehensive coverage. Focus on add-ons and retention.`;
      } else {
        whyOpportunity = `${customer.first_name} holds active PB-issued ${coveredProducts.join(' and ')} policies. However, ${missingProducts.join(' and ')} coverage is missing.`;
        if (customer.renewal_due_days != null && customer.renewal_due_days < 30) {
          whyOpportunity += ` With a policy renewing in ${customer.renewal_due_days} days, there's peak touchpoint affinity.`;
        }
      }

      // Score breakdown array (matches frontend ScoreDimension[])
      const scoreBreakdown = Object.entries(pis.score_breakdown).map(([key, val]: [string, any]) => ({
        key,
        name: key.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        score: val.score,
        max: val.max,
      }));

      // Coverage array (matches frontend CoverageRow[])
      const coverageArray = [
        { id: 'motor', name: 'Motor', covered: !!customer.motor_cover, source: customer.coverage_source?.motor || null, icon: '🚗' },
        { id: 'life', name: 'Life', covered: !!customer.life_cover, source: customer.coverage_source?.life || null, icon: '🧬' },
        { id: 'health', name: 'Health', covered: !!customer.health_cover, source: customer.coverage_source?.health || null, icon: '🏥' },
        { id: 'term', name: 'Term', covered: !!customer.term_cover, source: customer.coverage_source?.term || null, icon: '📄' },
      ];

      ranked.push({
        customer_id: customer.id,
        name: `${customer.first_name} ${customer.last_name}`,
        initials: `${customer.first_name[0]}${customer.last_name[0]}`.toUpperCase(),
        protection_intelligence_score: pis.protection_intelligence_score,
        opportunity_score: os.opportunity_score,
        opportunity_breakdown: os.opportunity_breakdown,
        gapSummary,
        renewsInDays: customer.renewal_due_days ?? 999,
        why,
        whyOpportunity,
        customerTip: cachedInsights?.customer_tip || '',
        score_breakdown: scoreBreakdown,
        coverage: coverageArray,
        weak_spots: pis.weak_spots,
        top_gap: pis.top_gap,
      });
    }

    // Sort by OS descending
    ranked.sort((a, b) => b.opportunity_score - a.opportunity_score);

    res.json({
      success: true,
      data: {
        customers_ranked: ranked,
        top_opportunity: ranked[0]?.customer_id || null,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/customer/:customerId/full-profile
 * Returns everything the CustomerFile UI needs in a single call:
 * PIS + OS + coverage + AI-generated recommendations & talking points
 */
export async function getCustomerFullProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = req.params.customerId as string;

    const customer = (await pool.query(`SELECT * FROM customers WHERE id = $1`, [customerId])).rows[0];
    if (!customer) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }

    const [pis, os, insights] = await Promise.all([
      calculateProtectionScore(customerId),
      calculateOpportunityScore(customerId),
      getInsights(customerId),
    ]);

    // Build gap summary (rule-based, instant)
    const gaps: string[] = [];
    if (!customer.health_cover) gaps.push('Health gap');
    if (!customer.term_cover) gaps.push('Term gap');
    if (!customer.life_cover) gaps.push('Life gap');
    if (customer.renewal_due_days != null && customer.renewal_due_days < 30) {
      gaps.push(`Renews in ${customer.renewal_due_days} days`);
    }
    const gapSummary = gaps.length > 0 ? gaps.join(' · ') : 'All standard covers active';

    // Why reasons (rule-based, instant)
    const why: string[] = [];
    if (customer.renewal_due_days != null && customer.renewal_due_days < 30)
      why.push(`Renewal due in ${customer.renewal_due_days} days`);
    if (!customer.health_cover && (customer.dependents || 0) >= 1)
      why.push(`Health protection missing with ${customer.dependents} dependents`);
    if (customer.single_earner)
      why.push('Sole earning member');
    if (customer.home_loan)
      why.push('Home loan outstanding');
    if (os.opportunity_score >= 70)
      why.push('High conversion likelihood for this profile');

    // Score breakdown array
    const scoreBreakdown = Object.entries(pis.score_breakdown).map(([key, val]: [string, any]) => ({
      key,
      name: key.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      score: val.score,
      max: val.max,
    }));

    // Coverage array
    const coverageArray = [
      { id: 'motor', name: 'Motor', covered: !!customer.motor_cover, source: customer.coverage_source?.motor || null, icon: '🚗' },
      { id: 'life', name: 'Life', covered: !!customer.life_cover, source: customer.coverage_source?.life || null, icon: '🧬' },
      { id: 'health', name: 'Health', covered: !!customer.health_cover, source: customer.coverage_source?.health || null, icon: '🏥' },
      { id: 'term', name: 'Term', covered: !!customer.term_cover, source: customer.coverage_source?.term || null, icon: '📄' },
    ];

    res.json({
      success: true,
      data: {
        customer_id: customer.id,
        name: `${customer.first_name} ${customer.last_name}`,
        initials: `${customer.first_name[0]}${customer.last_name[0]}`.toUpperCase(),
        protection_intelligence_score: pis.protection_intelligence_score,
        opportunity_score: os.opportunity_score,
        opportunity_breakdown: os.opportunity_breakdown,
        gapSummary,
        renewsInDays: customer.renewal_due_days ?? 999,
        why,
        whyOpportunity: insights.why_opportunity,
        customerTip: insights.customer_tip,
        score_breakdown: scoreBreakdown,
        coverage: coverageArray,
        weak_spots: pis.weak_spots,
        top_gap: pis.top_gap,
        recommendations: insights.recommendations,
        talking_points: insights.talking_points,
        lesson_recommendations: insights.lesson_recommendations,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/customer/:customerId/recalculate
 * Manual trigger for recalculation
 */
export async function recalculateScores(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = req.params.customerId as string;

    const [protection, opportunity] = await Promise.all([
      calculateProtectionScore(customerId),
      calculateOpportunityScore(customerId),
    ]);

    res.json({
      success: true,
      data: { protection, opportunity },
      message: 'Scores recalculated successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/customer/:customerId/simulate
 * Body: { scenario, params? }
 * Runs a future risk simulation
 */
export async function runSimulation(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = req.params.customerId as string;
    const { scenario, params } = req.body;

    if (!scenario) {
      res.status(400).json({
        success: false,
        error: 'scenario is required. Supported: marriage, child_birth, home_purchase, salary_increase, new_dependent, retirement_planning',
      });
      return;
    }

    const result = await runSimEngine({ customer_id: customerId, scenario, params });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/customer/:customerId/simulations
 * Returns simulation history for a customer
 */
export async function getSimulationHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = req.params.customerId as string;
    const result = await pool.query(
      `SELECT * FROM risk_simulations WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [customerId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/customer/:customerId/regenerate-insights
 * Manually triggers AI insight regeneration for a customer.
 * Useful after seed, bulk updates, or when insights feel stale.
 */
export async function regenerateInsights(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = req.params.customerId as string;

    const customer = (await pool.query(`SELECT id FROM customers WHERE id = $1`, [customerId])).rows[0];
    if (!customer) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }

    const { generateAndCacheInsights } = await import('./insights-generator');
    const insights = await generateAndCacheInsights(customerId, 'MANUAL_TRIGGER');

    res.json({
      success: true,
      data: insights,
      message: 'AI insights regenerated successfully',
    });
  } catch (error) {
    next(error);
  }
}
