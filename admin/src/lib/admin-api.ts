import type {
  AdminSessionResponse,
  AvatarForReview,
  AvatarsForReviewResponse,
  ReviewAvatarRequest,
} from '@measagent/shared/admin';
import type { AvatarListing } from '@measagent/shared/avatars';

const API_BASE_URL = process.env.MA_API_BASE_URL ?? 'http://127.0.0.1:3010';

export type AdminSignInResult =
  | { status: 'signed-in'; session: AdminSessionResponse }
  | { status: 'refused'; reason: string };

/** The refusals the portal can explain; anything else is an outage, and throws. */
const SIGN_IN_REFUSAL_REASONS: Record<number, string> = {
  400: 'Enter a username and a password.',
  401: 'Wrong username or password.',
  429: 'Too many attempts. Wait fifteen minutes and try again.',
  503: 'Admin sign-in is not configured on the api.',
};

export async function signInAdmin(
  username: string,
  password: string,
): Promise<AdminSignInResult> {
  const response = await fetch(`${API_BASE_URL}/v1/admin/sessions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const refusalReason = SIGN_IN_REFUSAL_REASONS[response.status];
  if (refusalReason !== undefined) return { status: 'refused', reason: refusalReason };
  if (!response.ok) throw new Error(`Admin sign-in failed with ${response.status}`);

  return {
    status: 'signed-in',
    session: (await response.json()) as AdminSessionResponse,
  };
}

/** Null means the token is no longer accepted, so the caller should sign in again. */
export async function listAvatarsForReview(
  token: string,
  listing: AvatarListing,
): Promise<AvatarForReview[] | null> {
  const response = await fetch(
    `${API_BASE_URL}/v1/admin/avatars?${new URLSearchParams({ listing })}`,
    { headers: { authorization: `Bearer ${token}` } },
  );

  if (response.status === 401) return null;
  if (!response.ok) throw new Error(`Loading avatars failed with ${response.status}`);

  return ((await response.json()) as AvatarsForReviewResponse).avatars;
}

/** False means the token is no longer accepted. */
export async function reviewAvatar(
  token: string,
  avatarId: string,
  review: ReviewAvatarRequest,
): Promise<boolean> {
  const response = await fetch(
    `${API_BASE_URL}/v1/admin/avatars/${encodeURIComponent(avatarId)}`,
    {
      method: 'PATCH',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify(review),
    },
  );

  if (response.status === 401) return false;
  if (!response.ok)
    throw new Error(`Reviewing ${avatarId} failed with ${response.status}`);
  return true;
}
