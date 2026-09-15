'use server';

import type { ReviewAvatarRequest } from '@measagent/shared/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { reviewAvatar, signInAdmin } from '@/lib/admin-api';
import {
  clearAdminSessionToken,
  readAdminSessionToken,
  writeAdminSessionToken,
} from '@/lib/admin-session';

export interface SignInFormState {
  error: string | null;
  /** Handed back so a refused attempt keeps the username React resets the form to. */
  username: string;
}

export async function signInAction(
  _previousState: SignInFormState,
  formData: FormData,
): Promise<SignInFormState> {
  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  const result = await signInAdmin(username, password);
  if (result.status === 'refused') return { error: result.reason, username };

  await writeAdminSessionToken(
    result.session.sessionToken,
    new Date(result.session.sessionExpiresAt),
  );
  redirect('/');
}

const REVIEW_DECISIONS: ReadonlyArray<ReviewAvatarRequest['listing']> = [
  'listed',
  'declined',
];

/**
 * Reachable by a direct POST, not only through the review page, so it checks
 * for a session itself — and the api checks the token again regardless.
 */
export async function reviewAvatarAction(formData: FormData): Promise<void> {
  const token = await readAdminSessionToken();
  if (token === null) redirect('/login');

  const avatarId = String(formData.get('avatarId') ?? '');
  const decision = REVIEW_DECISIONS.find(
    (listing) => listing === formData.get('listing'),
  );
  if (avatarId === '' || decision === undefined) {
    throw new Error('A review needs an avatar and a decision');
  }

  const isAccepted = await reviewAvatar(token, avatarId, { listing: decision });
  if (!isAccepted) redirect('/login');

  revalidatePath('/');
}

/**
 * Forgets the token on this browser. The api keeps no session list, so a copied
 * token stays valid until it expires — which is why admin tokens are short.
 */
export async function signOutAction(): Promise<void> {
  await clearAdminSessionToken();
  redirect('/login');
}
