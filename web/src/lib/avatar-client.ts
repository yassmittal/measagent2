import type {
  LaunchAvatarRequest,
  OwnAvatar,
  OwnAvatarResponse,
  UpdateOwnAvatarRequest,
} from '@measagent/shared/avatars';
import {
  API_BASE_URL,
  ApiRequestError,
  apiIdentityHeaders,
  apiJsonHeaders,
  readApiErrorMessage,
} from './api-client';

const OWN_AVATAR_URL = `${API_BASE_URL}/v1/me/avatar`;

export async function loadOwnAvatar(): Promise<OwnAvatar | null> {
  const response = await fetch(OWN_AVATAR_URL, { headers: apiIdentityHeaders() });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new ApiRequestError('Could not load your avatar.', response.status);
  }

  return ((await response.json()) as OwnAvatarResponse).avatar;
}

export async function launchAvatar(request: LaunchAvatarRequest): Promise<OwnAvatar> {
  return sendOwnAvatarChange('POST', request, 'That avatar could not be launched.');
}

export async function updateOwnAvatar(
  request: UpdateOwnAvatarRequest,
): Promise<OwnAvatar> {
  return sendOwnAvatarChange('PATCH', request, 'Your changes did not save.');
}

async function sendOwnAvatarChange(
  method: 'POST' | 'PATCH',
  request: LaunchAvatarRequest | UpdateOwnAvatarRequest,
  fallbackMessage: string,
): Promise<OwnAvatar> {
  const response = await fetch(OWN_AVATAR_URL, {
    method,
    headers: apiJsonHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new ApiRequestError(
      await readApiErrorMessage(response, fallbackMessage),
      response.status,
    );
  }

  return ((await response.json()) as OwnAvatarResponse).avatar;
}
