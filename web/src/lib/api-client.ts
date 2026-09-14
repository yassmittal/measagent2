import { readSessionToken } from './auth/session-storage';
import { readDeviceId } from './device-id';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3010';

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export function apiIdentityHeaders(): HeadersInit {
  const headers: Record<string, string> = { 'x-device-id': readDeviceId() };

  const sessionToken = readSessionToken();
  if (sessionToken !== null) headers.authorization = `Bearer ${sessionToken}`;

  return headers;
}

/**
 * For requests that actually send a JSON body — and only those. Declaring the
 * content type on a bodyless request makes Fastify reject it as a malformed
 * JSON payload before the route is ever reached.
 */
export function apiJsonHeaders(): HeadersInit {
  return { ...apiIdentityHeaders(), 'Content-Type': 'application/json' };
}
