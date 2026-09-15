import type { RelationshipResponse } from '@measagent/shared';
import { API_BASE_URL, ApiRequestError, apiIdentityHeaders } from './api-client';

const RELATIONSHIPS_URL = `${API_BASE_URL}/v1/relationships`;

export async function loadRelationship(avatarId: string): Promise<RelationshipResponse> {
  const response = await fetch(`${RELATIONSHIPS_URL}/${avatarId}`, {
    headers: apiIdentityHeaders(),
  });
  if (!response.ok) {
    throw new ApiRequestError(
      'Could not load what this avatar remembers',
      response.status,
    );
  }
  return (await response.json()) as RelationshipResponse;
}

/** One avatar forgets you when given its id; every avatar does when given null. */
export async function forgetRelationship(avatarId: string | null): Promise<void> {
  const url = avatarId === null ? RELATIONSHIPS_URL : `${RELATIONSHIPS_URL}/${avatarId}`;
  const response = await fetch(url, { method: 'DELETE', headers: apiIdentityHeaders() });
  if (!response.ok) {
    throw new ApiRequestError('That did not go through. Try again.', response.status);
  }
}
