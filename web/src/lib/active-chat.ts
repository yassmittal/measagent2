const STORAGE_KEY = 'measagent.active-chat';

export function readActiveChatId(): string | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored !== null && stored !== '' ? stored : null;
  } catch {
    return null;
  }
}

export function writeActiveChatId(chatId: string | null): void {
  try {
    if (chatId === null) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, chatId);
  } catch {
    // Storage is unavailable (private mode, blocked cookies). The conversation
    // still works for this session; it just will not be restored on reload.
  }
}
