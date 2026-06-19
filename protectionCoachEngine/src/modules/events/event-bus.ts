import { EventEmitter } from 'events';
import pool from '../../config/database';

export const eventBus = new EventEmitter();

export interface DomainEventPayload {
  customer_id: string;
  policy_id?: string | null;
  event_type: string;
  payload?: object;
}

// Persist event to DB and emit for handlers
export async function emitEvent(event: DomainEventPayload) {
  const query = `
    INSERT INTO domain_events (customer_id, policy_id, event_type, status, payload)
    VALUES ($1, $2, $3, 'PENDING', $4)
    RETURNING *
  `;
  const values = [
    event.customer_id,
    event.policy_id || null,
    event.event_type,
    JSON.stringify(event.payload || {}),
  ];

  const result = await pool.query(query, values);
  const savedEvent = result.rows[0];

  // Emit in-process event for immediate handling
  eventBus.emit('domainEvent', savedEvent);
  eventBus.emit(event.event_type, savedEvent);

  return savedEvent;
}

// Mark event as processed
export async function markEventProcessed(eventId: string) {
  const query = `UPDATE domain_events SET status = 'PROCESSED', processed_at = NOW() WHERE id = $1`;
  await pool.query(query, [eventId]);
}

// Mark event as failed
export async function markEventFailed(eventId: string, errorMessage: string) {
  const query = `UPDATE domain_events SET status = 'FAILED', error_message = $2 WHERE id = $1`;
  await pool.query(query, [eventId, errorMessage]);
}
