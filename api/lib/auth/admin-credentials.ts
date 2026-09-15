import { createHash, timingSafeEqual } from 'node:crypto';

export interface AdminCredentials {
  username: string;
  password: string;
}

export interface ConfiguredAdmin {
  username: string;
  /** An argon2id hash from `Bun.password.hash`; the password itself is never configured. */
  passwordHash: string;
}

/**
 * `MA_ADMIN_PASSWORD_HASH` holds the argon2id hash base64-encoded, not the hash
 * itself. A raw hash is `$argon2id$v=19$m=…`, and Bun expands `$name` inside
 * `.env` values — even single-quoted ones — before this service reads them, so
 * a raw hash arrives as a meaningless fragment. Base64 has no `$` for any env
 * loader to touch.
 */
export function readConfiguredAdmin(username: string, encodedPasswordHash: string): ConfiguredAdmin {
  return {
    username,
    passwordHash: Buffer.from(encodedPasswordHash, 'base64').toString('utf8'),
  };
}

export function encodeAdminPasswordHash(passwordHash: string): string {
  return Buffer.from(passwordHash, 'utf8').toString('base64');
}

export function isAdminSignInConfigured(admin: ConfiguredAdmin): boolean {
  return admin.username !== '' && admin.passwordHash !== '';
}

/**
 * Both halves are always checked, and the username in constant time, so how
 * long a refusal takes does not say which half was wrong.
 */
export async function verifyAdminCredentials(
  attempt: AdminCredentials,
  admin: ConfiguredAdmin
): Promise<boolean> {
  const isUsernameCorrect = timingSafeEqual(
    sha256(attempt.username),
    sha256(admin.username)
  );
  const isPasswordCorrect = await Bun.password.verify(attempt.password, admin.passwordHash);
  return isUsernameCorrect && isPasswordCorrect;
}

/** Equal-length digests, because `timingSafeEqual` refuses buffers of different sizes. */
function sha256(text: string): Buffer {
  return createHash('sha256').update(text).digest();
}
