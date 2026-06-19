import assert from 'node:assert/strict';
import test from 'node:test';
import { presentCadenceResult } from '../modules/cadence/cadence.presenter';
import { getCadenceResponseJsonSchema } from '../modules/cadence/cadence.response-schema';
import { cadenceOutputSchema } from '../modules/cadence/cadence.schema';
import { presentPartnerIntelligence } from '../modules/partner-intelligence/partner-intelligence.presenter';
import { makeLead } from './fixtures';

test('Gemini response schema omits the unsupported JSON Schema draft declaration', () => {
  const schema = getCadenceResponseJsonSchema() as Record<string, unknown>;
  assert.equal('$schema' in schema, false);
});

test('Cadence presenter returns generated fields directly in the API data object', () => {
  const cadence = cadenceOutputSchema.parse({
    coach_tip: 'Call during the renewal window.',
    whatsapp_message: 'Hi Anjali, your upcoming renewal is a good moment to review the health and term protection gaps affecting your family. With two dependents and a home loan, the right cover can help protect your savings and responsibilities from unexpected events. Could we schedule a quick 10-minute call today to review suitable options?',
    mission: {
      title: 'Review Anjali health cover',
      subtitle: 'Highest stored opportunity',
      action: 'Call Anjali and discuss the health gap',
      tags: ['Health', 'Renewal'],
    },
    talking_points: ['One', 'Two', 'Three'],
    lesson_recommendations: [
      { priority: true, icon: 'hospital', title: 'Health gap', body: 'Discuss health.' },
      { priority: true, icon: 'family', title: 'Family need', body: 'Discuss dependents.' },
      { priority: false, icon: 'document', title: 'Term gap', body: 'Discuss term.' },
    ],
  });
  const presented = presentCadenceResult({
    partner_id: 'P001',
    customer_id: 'C5501',
    opportunity_score: 89,
    why: ['Renewal soon'],
    cadence,
    meta: {
      source: 'cache',
      stale: false,
      model: 'gemini-2.5-flash',
      generated_at: new Date('2026-06-19T10:00:00.000Z'),
    },
  });

  assert.equal(presented.coach_tip, cadence.coach_tip);
  assert.equal(presented.whatsapp_message, cadence.whatsapp_message);
  assert.equal('cadence' in presented, false);
});

test('partner intelligence presenter does not expose internal IDs or profile PII', () => {
  const data = presentPartnerIntelligence({
    partner_id: 'P001',
    customers_ranked: [makeLead()],
    top_opportunity: 'C5501',
  });
  const lead = data.customers_ranked[0] as Record<string, unknown>;

  assert.equal(lead.customer_id, 'C5501');
  assert.equal('internal_customer_id' in lead, false);
  assert.equal('date_of_birth' in lead, false);
  assert.equal('annual_income' in lead, false);
});
