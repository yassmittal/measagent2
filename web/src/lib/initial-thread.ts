import type { LoadThreadResponse } from '@measagent/shared';
import { readActiveChatId, writeActiveChatId } from './active-chat';
import { listThreads, loadThread } from './chat-client';

export async function loadInitialThread(
  isSignedIn: boolean,
): Promise<LoadThreadResponse | null> {
  const rememberedChatId = readActiveChatId();

  if (rememberedChatId !== null) {
    const thread = await loadThread(rememberedChatId);
    if (thread !== null) return thread;

    writeActiveChatId(null);
  }

  if (!isSignedIn) return null;

  const [mostRecent] = await listThreads();
  if (mostRecent === undefined) return null;

  const thread = await loadThread(mostRecent.id);
  if (thread !== null) writeActiveChatId(thread.chat.id);
  return thread;
}
