/**
 * Every token this service signs shares one secret, so a signature alone only
 * proves that *some* token was issued here. The purpose claim is what stops one
 * kind being presented as another — before it existed, a live-voice marker sent
 * as `Authorization: Bearer` read as a signed-in session.
 */
export const TOKEN_PURPOSE = Object.freeze({
  session: 'session',
  voiceSession: 'voice-session',
  adminSession: 'admin-session',
  /** Carried in the weekly email's unsubscribe link, which works without signing in. */
  weeklySummaryUnsubscribe: 'weekly-summary-unsubscribe',
});

export type TokenPurpose = (typeof TOKEN_PURPOSE)[keyof typeof TOKEN_PURPOSE];

export function hasTokenPurpose(claims: unknown, purpose: TokenPurpose): boolean {
  return (
    typeof claims === 'object' &&
    claims !== null &&
    (claims as { purpose?: unknown }).purpose === purpose
  );
}
