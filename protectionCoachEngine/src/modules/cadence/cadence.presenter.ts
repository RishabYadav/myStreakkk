import { CadenceResult } from './cadence.service';

export function presentCadenceResult(result: CadenceResult) {
  return {
    partner_id: result.partner_id,
    customer_id: result.customer_id,
    opportunity_score: result.opportunity_score,
    why: result.why,
    ...result.cadence,
    meta: result.meta,
  };
}
