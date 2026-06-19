import { callPythonApi } from '../../utils/python-api.client';
import { GenerateContentRequest, GenerateContentResponse } from './llm.types';

export async function getRecommendedTemplate(
  payload: GenerateContentRequest
): Promise<GenerateContentResponse> {
  return callPythonApi<GenerateContentResponse>('/generate-content', payload);
}
