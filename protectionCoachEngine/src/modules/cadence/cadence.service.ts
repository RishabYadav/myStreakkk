import { createHash } from 'crypto';
import { env } from '../../config/env';
import { HttpError } from '../../shared/errors/http-error';
import { getActionableLead } from '../partner-intelligence/partner-intelligence.service';
import { PartnerLead } from '../partner-intelligence/partner-intelligence.types';
import { findExactCache, findLatestCache, saveCache } from './cadence-cache.repository';
import { generateCadenceOutput } from './cadence.generator';
import { CadenceOutput } from './cadence.schema';

export interface GenerateCadenceRequest {
  partner_id: string;
  customer_id?: string;
  force_refresh?: boolean;
}

export interface CadenceResult {
  partner_id: string;
  customer_id: string;
  opportunity_score: number;
  why: string[];
  cadence: CadenceOutput;
  meta: {
    source: 'cache' | 'gemini';
    stale: boolean;
    model: string;
    generated_at: Date;
  };
}

export async function generateCadence(request: GenerateCadenceRequest): Promise<CadenceResult> {
  const lead = await getActionableLead(request.partner_id, request.customer_id);
  const inputHash = createCadenceInputHash(lead);

  if (!request.force_refresh) {
    const cached = await findExactCache(lead.internal_customer_id, inputHash, env.GEMINI_MODEL);
    if (cached) {
      return formatResult(lead, cached.output, 'cache', false, cached.model, cached.generated_at);
    }
  }

  try {
    const output = await generateCadenceOutput(lead);
    const cached = await saveCache(
      lead.internal_customer_id,
      inputHash,
      env.GEMINI_MODEL,
      output
    );
    return formatResult(lead, cached.output, 'gemini', false, cached.model, cached.generated_at);
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown Gemini error";
    console.error("[CADENCE] Generation failed for customer " + lead.customer_id + ": " + details);
    const stale = await findLatestCache(lead.internal_customer_id);
    if (stale) {
      console.warn(
        `[CADENCE] Gemini unavailable; serving stale cache for customer ${lead.customer_id}`
      );
      return formatResult(lead, stale.output, 'cache', true, stale.model, stale.generated_at);
    }
    throw new HttpError(503, 'Cadence generation is temporarily unavailable');
  }
}

export function createCadenceInputHash(lead: PartnerLead): string {
  const hashInput = {
    customer_id: lead.customer_id,
    profile: {
      life_stage: lead.life_stage,
      marital_status: lead.marital_status,
      dependents: lead.dependents,
      children: lead.children,
      occupation: lead.occupation,
      single_earner: lead.single_earner,
      home_loan: lead.home_loan,
      renewal_due_days: lead.renewal_due_days,
      last_interaction_days: lead.last_interaction_days,
      health_cover: lead.health_cover,
      term_cover: lead.term_cover,
      life_cover: lead.life_cover,
      motor_cover: lead.motor_cover,
      external_policies: lead.external_policies,
    },
    scores: {
      protection: lead.protection_intelligence_score,
      protection_breakdown: lead.protection_breakdown,
      protection_calculated_at: lead.protection_score_calculated_at?.toISOString() ?? null,
      opportunity: lead.opportunity_score,
      opportunity_breakdown: lead.opportunity_breakdown,
      opportunity_calculated_at: lead.opportunity_score_calculated_at?.toISOString() ?? null,
    },
    why: lead.why,
  };
  return createHash('sha256').update(JSON.stringify(hashInput)).digest('hex');
}

function formatResult(
  lead: PartnerLead,
  cadence: CadenceOutput,
  source: 'cache' | 'gemini',
  stale: boolean,
  model: string,
  generatedAt: Date
): CadenceResult {
  return {
    partner_id: lead.partner_id,
    customer_id: lead.customer_id,
    opportunity_score: lead.opportunity_score!,
    why: lead.why,
    cadence,
    meta: {
      source,
      stale,
      model,
      generated_at: generatedAt,
    },
  };
}
