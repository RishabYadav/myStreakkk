import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  session_id: string;
  customer_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  session_id: { type: String, required: true, index: true },
  customer_id: { type: String, required: true, index: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
});

// Compound index for fetching conversation history
ChatMessageSchema.index({ session_id: 1, created_at: 1 });

export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
