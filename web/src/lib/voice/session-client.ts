import type { OpenVoiceSessionResponse } from '@measagent/shared';
import { API_BASE_URL, ApiRequestError, apiJsonHeaders } from '../api-client';

export async function openVoiceSession(chatId: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/v1/voice/sessions`, {
    method: 'POST',
    headers: apiJsonHeaders(),
    body: JSON.stringify({ chatId }),
  });

  if (!response.ok) {
    throw new ApiRequestError('Could not start the voice session.', response.status);
  }

  return ((await response.json()) as OpenVoiceSessionResponse).routeMarker;
}
