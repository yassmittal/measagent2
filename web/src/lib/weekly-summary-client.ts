import type {
  UpdateWeeklySummarySettingsRequest,
  WeeklySummarySettings,
  WeeklySummarySettingsResponse,
} from '@measagent/shared/weekly-summary';
import {
  API_BASE_URL,
  ApiRequestError,
  apiIdentityHeaders,
  apiJsonHeaders,
  readApiErrorMessage,
} from './api-client';

const SETTINGS_URL = `${API_BASE_URL}/v1/me/weekly-summary`;

export async function loadWeeklySummarySettings(): Promise<WeeklySummarySettings> {
  const response = await fetch(SETTINGS_URL, { headers: apiIdentityHeaders() });
  if (!response.ok) {
    throw new ApiRequestError('Could not load your email settings.', response.status);
  }
  return ((await response.json()) as WeeklySummarySettingsResponse).settings;
}

export async function updateWeeklySummarySettings(
  request: UpdateWeeklySummarySettingsRequest,
): Promise<WeeklySummarySettings> {
  const response = await fetch(SETTINGS_URL, {
    method: 'PATCH',
    headers: apiJsonHeaders(),
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new ApiRequestError(
      await readApiErrorMessage(response, 'That did not save. Try again.'),
      response.status,
    );
  }
  return ((await response.json()) as WeeklySummarySettingsResponse).settings;
}

/** Works signed out: the token in the email's link is the only proof needed. */
export async function unsubscribeFromWeeklySummary(token: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/v1/weekly-summary/unsubscribe?token=${encodeURIComponent(token)}`,
    { method: 'POST' },
  );
  if (!response.ok) {
    throw new ApiRequestError(
      await readApiErrorMessage(response, 'That did not go through. Try again.'),
      response.status,
    );
  }
}
