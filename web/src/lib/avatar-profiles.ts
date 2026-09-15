import type {
  AvatarDirectoryResponse,
  AvatarProfile,
  AvatarProfileResponse,
} from '@measagent/shared/avatars';
import { connection } from 'next/server';
import { cache } from 'react';
import { API_BASE_URL, ApiRequestError } from './api-client';

export async function loadAvatarDirectory(): Promise<AvatarProfile[]> {
  await connection();
  const response = await fetch(`${API_BASE_URL}/v1/avatars`);

  if (!response.ok) {
    throw new ApiRequestError('Could not load the directory', response.status);
  }
  return ((await response.json()) as AvatarDirectoryResponse).avatars;
}

export const loadAvatarProfile = cache(
  async (handle: string): Promise<AvatarProfile | null> => {
    await connection();
    const response = await fetch(
      `${API_BASE_URL}/v1/avatars/${encodeURIComponent(handle)}`,
    );

    // 400 is a handle that could never exist, so it is as missing as a 404.
    if (response.status === 404 || response.status === 400) return null;
    if (!response.ok) {
      throw new ApiRequestError('Could not load that avatar', response.status);
    }
    return ((await response.json()) as AvatarProfileResponse).avatar;
  },
);
