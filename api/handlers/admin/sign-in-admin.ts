import type { FastifyReply, FastifyRequest } from 'fastify';
import type { AdminSessionResponse, AdminSignInRequest } from '@measagent/shared/admin';
import {
  isAdminSignInConfigured,
  readConfiguredAdmin,
  verifyAdminCredentials,
} from '../../lib/auth/admin-credentials.js';
import { TOKEN_PURPOSE } from '../../lib/auth/token-purpose.js';
import { ADMIN_SESSION_LIFETIME_HOURS } from '../../shared/constants.js';
import { getErrorMessage } from '../../shared/errors.js';

const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

/**
 * `POST /v1/admin/sessions` — the admin portal's sign-in.
 *
 * Called by the portal's own server, never a browser, which is why this route
 * needs no CORS origin. It is rate limited per address, since a password is
 * the only thing standing between a guesser and the directory.
 */
export async function signInAdmin(
  this: FastifyRequest['server'],
  request: FastifyRequest<{ Body: AdminSignInRequest }>,
  reply: FastifyReply
): Promise<AdminSessionResponse | undefined> {
  const admin = readConfiguredAdmin(
    this.config.MA_ADMIN_USERNAME,
    this.config.MA_ADMIN_PASSWORD_HASH
  );
  if (!isAdminSignInConfigured(admin) || this.config.MA_SESSION_SECRET === '') {
    return reply.serviceUnavailable('Admin sign-in is not configured');
  }

  let isAdmin: boolean;
  try {
    isAdmin = await verifyAdminCredentials(request.body, admin);
  } catch (error) {
    // A malformed hash in the environment, not a wrong password — worth a log
    // line that says how to fix it, and still a refusal.
    this.log.error(
      { err: getErrorMessage(error) },
      'MA_ADMIN_PASSWORD_HASH is not a base64-encoded argon2 hash — regenerate it with `bun run admin:hash-password`'
    );
    return reply.serviceUnavailable('Admin sign-in is misconfigured');
  }

  if (!isAdmin) {
    this.log.warn('Refused an admin sign-in');
    return reply.unauthorized('Wrong username or password');
  }

  return {
    sessionToken: this.jwt.sign(
      { sub: 'admin', purpose: TOKEN_PURPOSE.adminSession },
      { expiresIn: `${ADMIN_SESSION_LIFETIME_HOURS}h` }
    ),
    sessionExpiresAt: new Date(
      Date.now() + ADMIN_SESSION_LIFETIME_HOURS * MILLISECONDS_PER_HOUR
    ).toISOString(),
  };
}
