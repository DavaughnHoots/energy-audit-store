/**
 * Utility functions for structured logging
 */

/**
 * Generates a UUID for request correlation
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Hashes a string for anonymization
 */
export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).substring(0, 8);
}

/**
 * Creates a structured log entry
 */
export function createLogEntry(
  level: 'info' | 'warn' | 'error' | 'debug',
  component: string,
  operation: string,
  requestId: string,
  details: Record<string, any>,
  performance?: { duration_ms: number }
): string {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    component,
    operation,
    correlation: {
      request_id: requestId
    },
    details,
    ...(performance && { performance })
  });
}
