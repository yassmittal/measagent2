import type {
  ConsentResponse,
  SessionResponse,
  SignInResponse,
  UserProfile,
} from '@measagent/shared';
import {
  API_BASE_URL,
  ApiRequestError,
  apiIdentityHeaders,
  apiJsonHeaders,
} from './api-client';

/** Trade a Google credential for a session of this product's own. */
export async function signInWithGoogle(idToken: string): Promise<SignInResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/auth/google`, {
    method: 'POST',
    headers: apiJsonHeaders(),
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    throw new ApiRequestError(
      response.status === 503
        ? 'Signing in is not switched on yet.'
        : 'That sign-in did not go through. Try again.',
      response.status,
    );
  }

  return (await response.json()) as SignInResponse;
}

export async function loadSignedInUser(): Promise<UserProfile | null> {
  const response = await fetch(`${API_BASE_URL}/v1/auth/session`, {
    headers: apiIdentityHeaders(),
  });

  if (response.status === 401) return null;
  if (!response.ok)
    throw new ApiRequestError('Could not read the session', response.status);

  return ((await response.json()) as SessionResponse).user;
}

export async function acceptConsent(): Promise<ConsentResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/consent`, {
    method: 'POST',
    headers: apiIdentityHeaders(),
  });

  if (!response.ok) {
    throw new ApiRequestError('Could not record that. Try again.', response.status);
  }

  return (await response.json()) as ConsentResponse;
}
