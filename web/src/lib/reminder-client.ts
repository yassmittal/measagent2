import type {
  DeliverReturnReminderRequest,
  DeliverReturnReminderResponse,
} from '@measagent/shared';
import { API_BASE_URL, ApiRequestError, apiJsonHeaders } from './api-client';

export async function deliverReturnReminder(
  avatarId: string,
): Promise<DeliverReturnReminderResponse['delivery']> {
  const request: DeliverReturnReminderRequest = { avatarId };
  const response = await fetch(`${API_BASE_URL}/v1/reminders/return`, {
    method: 'POST',
    headers: apiJsonHeaders(),
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new ApiRequestError('Could not check for a reminder', response.status);
  }
  return ((await response.json()) as DeliverReturnReminderResponse).delivery;
}
