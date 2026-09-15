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

export async function readApiErrorMessage(
  response: Response,
  fallbackMessage: string,
): Promise<string> {
  try {
    const body = (await response.json()) as { message?: unknown };
    return typeof body.message === 'string' && body.message !== ''
      ? body.message
      : fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

export function apiIdentityHeaders(): HeadersInit {
  const headers: Record<string, string> = { 'x-device-id': readDeviceId() };

  const sessionToken = readSessionToken();
  if (sessionToken !== null) headers.authorization = `Bearer ${sessionToken}`;

  return headers;
}

export function apiJsonHeaders(): HeadersInit {
  return { ...apiIdentityHeaders(), 'Content-Type': 'application/json' };
}
