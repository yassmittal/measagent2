export const ROUTE_MARKER_PREFIX = 'ma-route:';

export interface LiveVoiceMarker {
  threadId: string;
  userId: string;
  sessionId: string;
}

export function encodeRouteMarker(marker: LiveVoiceMarker): string {
  return `${ROUTE_MARKER_PREFIX} ${JSON.stringify(marker)}`;
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;

export function parseRouteMarker(
  messages: Array<{ role?: string; content?: unknown }> | undefined
): LiveVoiceMarker | null {
  if (!Array.isArray(messages)) return null;

  for (const message of messages) {
    if (message?.role !== 'system' || typeof message.content !== 'string') continue;

    const line = message.content
      .split('\n')
      .find((candidate) => candidate.startsWith(ROUTE_MARKER_PREFIX));
    if (line === undefined) continue;

    try {
      const raw: unknown = JSON.parse(line.slice(ROUTE_MARKER_PREFIX.length).trim());
      if (typeof raw !== 'object' || raw === null) continue;

      const { threadId, userId, sessionId } = raw as Record<string, unknown>;
      if (
        isNonEmptyString(threadId) &&
        isNonEmptyString(userId) &&
        isNonEmptyString(sessionId)
      ) {
        return { threadId, userId, sessionId };
      }
    } catch {
      // Malformed marker — treat the request as unmarked rather than failing.
    }
  }
  return null;
}

export function lastUserMessageText(
  messages: Array<{ role?: string; content?: unknown }> | undefined
): string | null {
  if (!Array.isArray(messages)) return null;

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role !== 'user') continue;

    if (typeof message.content === 'string') return message.content.trim() || null;

    if (Array.isArray(message.content)) {
      const text = message.content
        .filter(
          (part) =>
            typeof part === 'object' &&
            part !== null &&
            (part as { type?: string }).type === 'text'
        )
        .map((part) => (part as { text?: string }).text ?? '')
        .join('')
        .trim();
      return text || null;
    }
  }
  return null;
}
