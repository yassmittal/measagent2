import type { FastifyRequest } from 'fastify';
import { toDeviceOwnerId } from '../lib/auth/owner-id.js';
import {
  hasTokenPurpose,
  TOKEN_PURPOSE,
  type TokenPurpose,
} from '../lib/auth/token-purpose.js';

export const DEVICE_ID_HEADER = 'x-device-id';

const DEVICE_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;
const BEARER_PREFIX = 'Bearer ';

export type CallerKind = 'account' | 'device';

export interface Caller {
  ownerId: string;
  kind: CallerKind;
}

interface BearerClaims {
  sub?: unknown;
  purpose?: unknown;
}

/** The verified claims of the bearer token, if it was issued here for `purpose`. */
function readBearerClaims(request: FastifyRequest, purpose: TokenPurpose): BearerClaims | null {
  const header = request.headers.authorization;
  if (typeof header !== 'string' || !header.startsWith(BEARER_PREFIX)) return null;

  try {
    const claims = request.server.jwt.verify<BearerClaims>(
      header.slice(BEARER_PREFIX.length).trim()
    );
    return hasTokenPurpose(claims, purpose) ? claims : null;
  } catch {
    // Expired or tampered with. Treated as "not signed in" rather than an
    // error, so a stale token in a long-open tab falls back to anonymous
    // instead of breaking every request the page makes.
    return null;
  }
}

export function readSessionOwnerId(request: FastifyRequest): string | null {
  const claims = readBearerClaims(request, TOKEN_PURPOSE.session);
  return typeof claims?.sub === 'string' && claims.sub !== '' ? claims.sub : null;
}

/** The admin portal's token. There is one admin, so the token names no one. */
export function isAdminRequest(request: FastifyRequest): boolean {
  return readBearerClaims(request, TOKEN_PURPOSE.adminSession) !== null;
}

export function readDeviceOwnerId(request: FastifyRequest): string | null {
  const header = request.headers[DEVICE_ID_HEADER];
  const value = Array.isArray(header) ? header[0] : header;
  if (typeof value !== 'string' || !DEVICE_ID_PATTERN.test(value)) return null;
  return toDeviceOwnerId(value);
}

export function readCaller(request: FastifyRequest): Caller | null {
  const sessionOwnerId = readSessionOwnerId(request);
  if (sessionOwnerId !== null) return { ownerId: sessionOwnerId, kind: 'account' };

  const deviceOwnerId = readDeviceOwnerId(request);
  if (deviceOwnerId !== null) return { ownerId: deviceOwnerId, kind: 'device' };

  return null;
}
