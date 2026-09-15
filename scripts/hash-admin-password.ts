#!/usr/bin/env bun
/**
 * Print the value for MA_ADMIN_PASSWORD_HASH.
 *
 * The api stores a hash, never the password, so a leaked `.env` does not hand
 * over the admin login. Bun's argon2id is what `Bun.password.verify` checks
 * against in `api/lib/auth/admin-credentials.ts`, so no hashing library is
 * needed on either side. The hash is printed base64-encoded, for the reason
 * given on `readConfiguredAdmin` there: Bun would otherwise expand every `$` in it.
 *
 * The password is read from stdin rather than an argument, so it never lands in
 * shell history:
 *
 *   bun run admin:hash-password
 */
import { encodeAdminPasswordHash } from '../api/lib/auth/admin-credentials.ts';

const password = prompt('Admin password:') ?? '';
if (password.length < 12) {
  console.error('Use at least 12 characters — this password is all that guards the directory.');
  process.exit(1);
}

const hash = await Bun.password.hash(password, { algorithm: 'argon2id' });
console.log(`\nMA_ADMIN_PASSWORD_HASH=${encodeAdminPasswordHash(hash)}`);
