import { generateResponse } from '../gemini.client';
import { buildChatSystemPrompt, buildCustomerContext } from '../prompts/chat.prompt';
import { ChatMessage } from './chat-history.model';
import pool from '../../../config/database';
import { calculateProtectionScore } from '../../scoring/engines/protection-score.engine';
import { getRecommendations } from '../../scoring/recommendations.engine';
import crypto from 'crypto';

/**
 * AI Chat Service — Customer Facing
 * 
 * Flow:
 * 1. Customer sends message
 * 2. System retrieves customer profile, PIS, recommendations from PostgreSQL
 * 3. System retrieves last N messages from MongoDB
 * 4. Builds prompt: system prompt + context + history + user message
 * 5. Calls Gemini Flash
 * 6. Saves both user message and AI response to MongoDB
 * 7. Returns AI response
 */

export async function startChatSession(customerId: string): Promise<string> {
  // Verify customer exists
  const result = await pool.query(`SELECT id FROM customers WHERE id = $1`, [customerId]);
  if (!result.rows[0]) throw new Error('Customer not found');
  return crypto.randomUUID();
}

export async function sendMessage(
  sessionId: string,
  customerId: string,
  userMessage: string
): Promise<string> {
  // 1. Save user message to MongoDB
  await ChatMessage.create({
    session_id: sessionId,
    customer_id: customerId,
    role: 'user',
    content: userMessage,
  });

  // 2. Retrieve context from PostgreSQL (scores + profile)
  const customer = (await pool.query(`SELECT * FROM customers WHERE id = $1`, [customerId])).rows[0];
  if (!customer) throw new Error('Customer not found');

  const pis = await calculateProtectionScore(customerId);
  const recommendations = await getRecommendations(customerId);

  // 3. Build customer context string
  const contextStr = buildCustomerContext(customer, pis, recommendations);

  // 4. Get last 8 messages for conversation history
  const history = await ChatMessage.find({ session_id: sessionId })
    .sort({ created_at: -1 })
    .limit(8)
    .lean();

  const historyText = history
    .reverse()
    .map((m) => `${m.role === 'user' ? 'Customer' : 'Coach'}: ${m.content}`)
    .join('\n');

  // 5. Build full prompt
  const systemPrompt = buildChatSystemPrompt(contextStr);
  const fullPrompt = historyText
    ? `${systemPrompt}\n\nCONVERSATION SO FAR:\n${historyText}\n\nCustomer: ${userMessage}\nCoach:`
    : `${systemPrompt}\n\nCustomer: ${userMessage}\nCoach:`;

  // 6. Call Gemini
  const aiResponse = await generateResponse(fullPrompt);

  // 7. Save AI response to MongoDB
  await ChatMessage.create({
    session_id: sessionId,
    customer_id: customerId,
    role: 'assistant',
    content: aiResponse,
  });

  return aiResponse;
}

export async function getChatHistory(sessionId: string): Promise<any[]> {
  return ChatMessage.find({ session_id: sessionId })
    .sort({ created_at: 1 })
    .lean();
}

export async function getSessionsByCustomer(customerId: string): Promise<any[]> {
  // Get unique sessions for this customer
  const sessions = await ChatMessage.aggregate([
    { $match: { customer_id: customerId } },
    { $group: { _id: '$session_id', last_message: { $max: '$created_at' }, message_count: { $sum: 1 } } },
    { $sort: { last_message: -1 } },
    { $limit: 10 },
  ]);
  return sessions;
}
