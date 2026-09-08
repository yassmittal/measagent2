import { readDeviceId } from './device-id';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3010';

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}
export function apiRequestHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-device-id': readDeviceId(),
  };
}
