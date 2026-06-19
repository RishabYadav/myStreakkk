/** Swap API_BASE to your FastAPI host on the local network at integration time. */
const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? 'http://localhost:3000';

export type DemoEventType = 'BOOKING_EVENT' | 'QUESTIONNAIRE_EVENT';

export async function postEvent(eventType: DemoEventType): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: eventType }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function postDemoReset(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/demo/reset`, { method: 'POST' });
    return res.ok;
  } catch {
    return false;
  }
}

export interface AiChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface CustomerAiChatRequest {
  customer_id: string;
  customer_name?: string;
  message: string;
  history?: AiChatTurn[];
  caller_role?: 'customer' | 'partner';
}

export interface CustomerAiChatResponse {
  reply: string;
  suggestions?: string[];
}

// ─── Session management ───────────────────────────────────────
// We keep a sessionId per customer so conversation context persists.
const sessionCache: Record<string, string> = {};

async function getOrCreateSession(customerId: string): Promise<string | null> {
  if (sessionCache[customerId]) return sessionCache[customerId];

  try {
    const res = await fetch(`${API_BASE}/api/v1/ai/chat/start/${customerId}`, {
      method: 'POST',
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && json.data?.session_id) {
      sessionCache[customerId] = json.data.session_id;
      return json.data.session_id;
    }
  } catch {
    // backend unavailable
  }
  return null;
}

function mockCustomerAiReply(req: CustomerAiChatRequest): CustomerAiChatResponse {
  const msg = req.message.toLowerCase();
  const name = req.customer_name?.split(' ')[0] ?? 'there';

  if (msg.includes('score') || msg.includes('improve') || msg.includes('protection')) {
    return {
      reply: `Hi ${name}! Your Protection Intelligence Score reflects coverage gaps across health, term, and motor. Adding a family health floater and syncing external policies can lift it quickly. I can walk you through the highest-impact step first.`,
      suggestions: ['Show my biggest gap', 'Compare health plans', 'Sync external policy'],
    };
  }
  if (msg.includes('health') || msg.includes('gap') || msg.includes('missing')) {
    return {
      reply: `Your motor cover is active, but health protection is the main exposure right now. A combined Ergo floater could close that gap and may unlock combo premium savings of up to 15%.`,
      suggestions: ['Get a health quote', 'What does floater mean?', 'Talk to my advisor'],
    };
  }
  if (msg.includes('term') || msg.includes('life')) {
    return {
      reply: `Term life coverage adds a critical safety layer for your family. Linking or declaring term policies — even from other insurers — improves your index and gives clearer renewal visibility.`,
      suggestions: ['Link term policy', 'Why term matters', 'See coverage list'],
    };
  }
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    return {
      reply: `Hello ${name}! I'm your Protection Coach. I can explain your protection score, spot savings risks, and guide next steps in plain language.`,
      suggestions: ['What are my gaps?', 'Improve my score', 'Explain my coverage'],
    };
  }

  return {
    reply: `I understand you're asking about "${req.message.trim()}". Focus on health + term gaps — they're the fastest way to reduce savings exposure.`,
    suggestions: ['Summarize my risks', 'Health plan options', 'Contact advisor'],
  };
}

/**
 * Send a message to the Protection Coach AI.
 * Uses the real backend session-based chat when available, falls back to mock.
 * 
 * @param payload.caller_role - 'customer' (default) or 'partner' for advisor context
 */
export async function postCustomerAiChat(
  payload: CustomerAiChatRequest
): Promise<CustomerAiChatResponse> {
  const callerRole = payload.caller_role || 'customer';

  // Try to get/create a session with the backend
  const sessionId = await getOrCreateSession(payload.customer_id);

  if (sessionId) {
    try {
      const res = await fetch(`${API_BASE}/api/v1/ai/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          customer_id: payload.customer_id,
          message: payload.message,
          caller_role: callerRole,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.content) {
          return {
            reply: json.data.content,
            suggestions: json.data.suggestions || [],
          };
        }
      }
    } catch {
      // Backend call failed — fall through to mock
    }
  }

  // Fallback to mock
  await new Promise((r) => setTimeout(r, 900));
  return mockCustomerAiReply(payload);
}
