import { callPythonApi } from '../../utils/python-api.client';
import { findCachedTemplate, saveTemplateCache } from './llm.repository';
import { GenerateContentRequest, GenerateContentResponse } from './llm.types';

export async function getRecommendedTemplate(
  payload: GenerateContentRequest
): Promise<GenerateContentResponse> {
  const key = payload.key ?? 1;
  const partnerCode = payload.partner_code;

  const cached = await findCachedTemplate(partnerCode, key);
  if (cached) {
    return cached;
  }

  const result = await callPythonApi<GenerateContentResponse>('/generate-content', payload);
  await saveTemplateCache(partnerCode, key, result);
  return result;
}
