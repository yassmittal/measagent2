import type { OwnerVisitorResponse, OwnerVisitorsResponse } from '@measagent/shared';
import {
  API_BASE_URL,
  ApiRequestError,
  apiIdentityHeaders,
  readApiErrorMessage,
} from './api-client';

const OWN_VISITORS_URL = `${API_BASE_URL}/v1/me/avatar/visitors`;

export async function loadOwnVisitors(): Promise<OwnerVisitorsResponse> {
  const response = await fetch(OWN_VISITORS_URL, { headers: apiIdentityHeaders() });
  if (!response.ok) {
    throw new ApiRequestError(
      await readApiErrorMessage(response, 'Your visitors could not be loaded.'),
      response.status,
    );
  }
  return (await response.json()) as OwnerVisitorsResponse;
}

/** Null when there is no such visitor among yours. */
export async function loadOwnVisitor(
  visitorKey: string,
): Promise<OwnerVisitorResponse | null> {
  const response = await fetch(`${OWN_VISITORS_URL}/${encodeURIComponent(visitorKey)}`, {
    headers: apiIdentityHeaders(),
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new ApiRequestError(
      await readApiErrorMessage(response, 'These conversations could not be loaded.'),
      response.status,
    );
  }
  return (await response.json()) as OwnerVisitorResponse;
}
