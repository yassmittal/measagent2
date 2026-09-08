import type { FastifyRequest } from 'fastify';

/**
 * Until Stage 4 adds Google sign-in there are no accounts, so a conversation is
 * owned by a device id the browser mints once and keeps in `localStorage`.
 * It is not a security boundary — anyone can send any id — it exists so a
 * refresh does not lose the thread, and so `userId` is populated from day one.
 */
export const DEVICE_ID_HEADER = 'x-device-id';

const DEVICE_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

/** The caller's owner id, or null when the header is missing or malformed. */
export function readOwnerId(request: FastifyRequest): string | null {
  const header = request.headers[DEVICE_ID_HEADER];
  const value = Array.isArray(header) ? header[0] : header;
  if (typeof value !== 'string' || !DEVICE_ID_PATTERN.test(value)) return null;
  return `device:${value}`;
}
