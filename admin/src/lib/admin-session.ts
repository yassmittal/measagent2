import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'measagent_admin_session';

/**
 * The api's admin token, kept in an httpOnly cookie on this portal's own
 * origin. The browser holds it but no script can read it, and it only ever
 * travels back to this server — which is the one that calls the api.
 */
export async function readAdminSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

/** Only callable from a Server Function: cookies cannot be set while rendering. */
export async function writeAdminSessionToken(
  token: string,
  expiresAt: Date,
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    expires: expiresAt,
  });
}

export async function clearAdminSessionToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
