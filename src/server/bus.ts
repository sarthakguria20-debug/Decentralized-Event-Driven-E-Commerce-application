import { EventEmitter } from 'events';
import { EventLogEntry } from '../types';

// The Central Event Bus (Simulating Apache Kafka / AWS EventBridge)
export const bus = new EventEmitter();

// In-memory event log for UI visualization
export const eventsLog: EventLogEntry[] = [];

export function emitEvent(type: string, payload: any) {
  const logEntry: EventLogEntry = {
    id: Math.random().toString(36).substring(2, 9),
    type,
    payload,
    timestamp: new Date().toISOString(),
  };

  // Add to log (newest first)
  eventsLog.unshift(logEntry);
  if (eventsLog.length > 100) {
    eventsLog.pop();
  }

  // Publish domain event
  console.log(`[EventBus] ${type}`);
  bus.emit(type, payload);
}
