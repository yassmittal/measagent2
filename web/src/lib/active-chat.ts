const STORAGE_KEY_PREFIX = 'measagent.active-chat.';

const storageKeyFor = (avatarId: string): string => `${STORAGE_KEY_PREFIX}${avatarId}`;

export function readActiveChatId(avatarId: string): string | null {
  try {
    const stored = window.localStorage.getItem(storageKeyFor(avatarId));
    return stored !== null && stored !== '' ? stored : null;
  } catch {
    return null;
  }
}

export function writeActiveChatId(avatarId: string, chatId: string | null): void {
  try {
    if (chatId === null) window.localStorage.removeItem(storageKeyFor(avatarId));
    else window.localStorage.setItem(storageKeyFor(avatarId), chatId);
  } catch {
    // Storage is unavailable (private mode, blocked cookies). The conversation
    // still works for this session; it just will not be restored on reload.
  }
}

export function forgetAllActiveChats(): void {
  try {
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith(STORAGE_KEY_PREFIX)) window.localStorage.removeItem(key);
    }
  } catch {
    // Nothing was stored, so there is nothing to forget.
  }
}
