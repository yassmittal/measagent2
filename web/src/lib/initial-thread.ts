import type { LoadThreadResponse } from '@measagent/shared';
import { readActiveChatId, writeActiveChatId } from './active-chat';
import { listThreads, loadThread } from './chat-client';

export async function loadInitialThread(
  avatarId: string,
  isSignedIn: boolean,
): Promise<LoadThreadResponse | null> {
  const rememberedChatId = readActiveChatId(avatarId);

  if (rememberedChatId !== null) {
    const thread = await loadThread(rememberedChatId);
    if (thread !== null) return thread;

    writeActiveChatId(avatarId, null);
  }

  if (!isSignedIn) return null;

  const [mostRecent] = await listThreads(avatarId);
  if (mostRecent === undefined) return null;

  const thread = await loadThread(mostRecent.id);
  if (thread !== null) writeActiveChatId(avatarId, thread.chat.id);
  return thread;
}
