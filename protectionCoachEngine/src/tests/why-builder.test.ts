import assert from 'node:assert/strict';
import test from 'node:test';
import { buildWhyArray } from '../modules/partner-intelligence/why-builder';
import { makeLead } from './fixtures';

test('buildWhyArray derives deterministic renewal, coverage, and family-risk reasons', () => {
  const { why: _why, ...lead } = makeLead();
  const reasons = buildWhyArray(lead);

  assert.deepEqual(reasons, [
    'Renewal is due in 9 days, creating an immediate outreach window',
    'Missing health and term coverage',
    '2 dependents increase the impact of the current protection gaps',
    'Sole earning member with a home loan outstanding',
    'High conversion likelihood based on the stored opportunity signals',
  ]);
});

test('buildWhyArray falls back to the stored score ranking when no specific signal exists', () => {
  const { why: _why, ...lead } = makeLead({
    health_cover: true,
    term_cover: true,
    life_cover: true,
    motor_cover: true,
    dependents: 0,
    single_earner: false,
    home_loan: false,
    renewal_due_days: 180,
    last_interaction_days: 90,
    opportunity_breakdown: {
      protection_gap_severity: 0,
      renewal_urgency: 0,
      conversion_likelihood: 0,
      revenue_potential: 5,
      relationship_strength: 3,
    },
  });

  assert.deepEqual(buildWhyArray(lead), [
    'Highest stored Opportunity Score in this partner portfolio',
  ]);
});
