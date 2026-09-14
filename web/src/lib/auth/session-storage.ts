const TOKEN_STORAGE_KEY = 'measagent.session-token';

let cachedToken: string | null | undefined;

export function readSessionToken(): string | null {
  if (cachedToken !== undefined) return cachedToken;

  try {
    const stored = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    cachedToken = stored !== null && stored !== '' ? stored : null;
  } catch {
    cachedToken = null;
  }
  return cachedToken;
}

export function writeSessionToken(token: string | null): void {
  cachedToken = token;

  try {
    if (token === null) window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    else window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // Storage is blocked (private window, or third-party cookie settings). The
    // session still works for this tab; it just will not survive a reload.
  }
}
