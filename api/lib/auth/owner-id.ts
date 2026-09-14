const DEVICE_PREFIX = 'device:';
const ACCOUNT_PREFIX = 'google:';

export function toDeviceOwnerId(deviceId: string): string {
  return `${DEVICE_PREFIX}${deviceId}`;
}

export function toAccountOwnerId(googleSubject: string): string {
  return `${ACCOUNT_PREFIX}${googleSubject}`;
}

export function isAccountOwnerId(ownerId: string): boolean {
  return ownerId.startsWith(ACCOUNT_PREFIX);
}

export function isDeviceOwnerId(ownerId: string): boolean {
  return ownerId.startsWith(DEVICE_PREFIX);
}
