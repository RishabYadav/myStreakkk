import { Request, Response, NextFunction } from 'express';
import pool from '../../config/database';
import { calculateProtectionScore } from './engines/protection-score.engine';
import { calculateOpportunityScore } from './engines/opportunity-score.engine';
import { getRecommendations as getRecsEngine } from './recommendations.engine';
import { runSimulation as runSimEngine } from './engines/risk-simulation.engine';
import { emitEvent } from '../events/event-bus';

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
 * Returns all customers ranked by OS descending with top opportunity flagged
 */
export async function getCustomersRanked(req: Request, res: Response, next: NextFunction) {
  try {
    const partnerId = req.params.partnerId as string;

    // Get all customers for this partner
    const customersResult = await pool.query(
      `SELECT * FROM customers WHERE partner_id = $1 ORDER BY created_at`,
      [partnerId]
    );

    if (customersResult.rows.length === 0) {
      res.json({ success: true, data: { customers_ranked: [], top_opportunity: null } });
      return;
    }

    // Calculate scores for each customer
    const ranked: any[] = [];
    for (const customer of customersResult.rows) {
      const pis = await calculateProtectionScore(customer.id);
      const os = await calculateOpportunityScore(customer.id);

      ranked.push({
        customer_id: customer.id,
        name: `${customer.first_name} ${customer.last_name}`,
        protection_intelligence_score: pis.protection_intelligence_score,
        opportunity_score: os.opportunity_score,
        opportunity_breakdown: os.opportunity_breakdown,
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
