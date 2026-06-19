import assert from 'node:assert/strict';
import test from 'node:test';
import { createCadenceInputHash } from '../modules/cadence/cadence.service';
import {
  isTransientGeminiError,
  withTransientRetries,
} from '../modules/cadence/cadence.generator';
import { cadenceOutputSchema } from '../modules/cadence/cadence.schema';
import { makeLead } from './fixtures';

test('Cadence schema rejects incomplete Gemini output', () => {
  const result = cadenceOutputSchema.safeParse({
    coach_tip: 'Act now.',
    mission: { title: 'Call Anjali', subtitle: 'Renewal soon', action: 'Call', tags: [] },
    talking_points: ['One'],
    lesson_recommendations: [],
  });
  assert.equal(result.success, false);
});

test('input hash changes when a stored score timestamp changes', () => {
  const original = makeLead();
  const updated = makeLead({
    opportunity_score_calculated_at: new Date('2026-06-19T10:01:00.000Z'),
  });
  assert.notEqual(createCadenceInputHash(original), createCadenceInputHash(updated));
});

test('transient retry succeeds without retrying non-transient failures', async () => {
  let attempts = 0;
  const value = await withTransientRetries(
    async () => {
      attempts += 1;
      if (attempts < 3) {
        const error = new Error('temporary');
        Object.assign(error, { status: 503 });
        throw error;
      }
      return 'ok';
    },
    2,
    async () => undefined
  );
  assert.equal(value, 'ok');
  assert.equal(attempts, 3);

  attempts = 0;
  await assert.rejects(
    withTransientRetries(
      async () => {
        attempts += 1;
        throw new Error('invalid response');
      },
      2,
      async () => undefined
    ),
    /invalid response/
  );
  assert.equal(attempts, 1);
  assert.equal(isTransientGeminiError(Object.assign(new Error('rate limited'), { status: 429 })), true);
});
