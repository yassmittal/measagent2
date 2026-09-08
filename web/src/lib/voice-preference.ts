const STORAGE_KEY = 'measagent.voice-muted';

export function readVoiceMuted(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function writeVoiceMuted(muted: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(muted));
  } catch {
    // See above — the toggle still works for this session.
  }
}
