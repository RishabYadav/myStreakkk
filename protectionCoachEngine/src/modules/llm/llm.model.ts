import mongoose, { Schema, Document } from 'mongoose';
import { GenerateContentResponse } from './llm.types';

export interface ILlmCache extends Document {
  partner_code: string;
  key: number;
  response: GenerateContentResponse;
  created_at: Date;
  updated_at: Date;
}

const LlmCacheSchema = new Schema<ILlmCache>(
  {
    partner_code: { type: String, required: true },
    key: { type: Number, required: true },
    response: { type: Schema.Types.Mixed, required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { collection: 'llm' }
);

LlmCacheSchema.index({ partner_code: 1, key: 1 }, { unique: true });

export const LlmCache = mongoose.model<ILlmCache>('LlmCache', LlmCacheSchema);
