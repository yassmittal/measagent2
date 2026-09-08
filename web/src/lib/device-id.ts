const STORAGE_KEY = 'measagent.device-id';

let cached: string | null = null;

function mintDeviceId(): string {
  return crypto.randomUUID().replaceAll('-', '');
}

export function readDeviceId(): string {
  if (cached !== null) return cached;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored !== null && stored !== '') {
      cached = stored;
      return stored;
    }
    const minted = mintDeviceId();
    window.localStorage.setItem(STORAGE_KEY, minted);
    cached = minted;
    return minted;
  } catch {
    cached ??= mintDeviceId();
    return cached;
  }
}
