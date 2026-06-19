import { isMongoConnected } from '../../config/mongo';
import { GenerateContentResponse } from './llm.types';
import { LlmCache } from './llm.model';

export async function findCachedTemplate(
  partnerCode: string,
  key: number
): Promise<GenerateContentResponse | null> {
  if (!isMongoConnected()) {
    return null;
  }

  const doc = await LlmCache.findOne({ partner_code: partnerCode, key }).lean();
  if (!doc?.response) {
    return null;
  }

  return doc.response as GenerateContentResponse;
}

export async function saveTemplateCache(
  partnerCode: string,
  key: number,
  response: GenerateContentResponse
): Promise<void> {
  if (!isMongoConnected()) {
    return;
  }

  await LlmCache.findOneAndUpdate(
    { partner_code: partnerCode, key },
    {
      response,
      updated_at: new Date(),
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );
}
