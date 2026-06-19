import { Request, Response, NextFunction } from 'express';
import * as chatService from './chat/chat.service';
import * as coachService from './coach/coach.service';

// ─── Customer AI Chat ─────────────────────────────────────────

export async function startChat(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = req.params.customerId as string;
    const sessionId = await chatService.startChatSession(customerId);
    res.json({ success: true, data: { session_id: sessionId, customer_id: customerId } });
  } catch (error) {
    next(error);
  }
}

export async function sendChatMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const { session_id, customer_id, message, caller_role } = req.body;

    if (!session_id || !customer_id || !message) {
      res.status(400).json({ success: false, error: 'session_id, customer_id, and message are required' });
      return;
    }

    const role = caller_role || 'customer'; // 'customer' | 'partner'
    const { content, suggestions } = await chatService.sendMessage(session_id, customer_id, message, role);
    res.json({ success: true, data: { role: 'assistant', content, suggestions } });
  } catch (error) {
    next(error);
  }
}

export async function getChatHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionId = req.params.sessionId as string;
    const history = await chatService.getChatHistory(sessionId);
    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
}

export async function getCustomerSessions(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = req.params.customerId as string;
    const sessions = await chatService.getSessionsByCustomer(customerId);
    res.json({ success: true, data: sessions });
  } catch (error) {
    next(error);
  }
}

// ─── Advisor AI Coach ─────────────────────────────────────────

export async function getCoachInsights(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = req.params.customerId as string;
    const insights = await coachService.getCoachInsights(customerId);
    res.json({ success: true, data: { insights } });
  } catch (error) {
    next(error);
  }
}

export async function askCoach(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = req.params.customerId as string;
    const { question } = req.body;

    if (!question) {
      res.status(400).json({ success: false, error: 'question is required' });
      return;
    }

    const answer = await coachService.askCoach(customerId, question);
    res.json({ success: true, data: { answer } });
  } catch (error) {
    next(error);
  }
}

export async function getCustomerSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const customerId = req.params.customerId as string;
    const summary = await coachService.getCustomerSummary(customerId);
    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
}
