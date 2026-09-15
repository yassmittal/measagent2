import type { LoadThreadResponse } from '@measagent/shared';
import { readActiveChatId, writeActiveChatId } from './active-chat';
import { listThreads, loadThread } from './chat-client';
import { deliverReturnReminder } from './reminder-client';

export async function loadInitialThread(
  avatarId: string,
  isSignedIn: boolean,
): Promise<LoadThreadResponse | null> {
  // A follow-up the avatar left while this visitor was away is delivered into
  // a conversation of its own choosing, so that conversation is the one to open.
  // Failing to check is no reason not to open the page.
  if (isSignedIn) {
    const delivery = await deliverReturnReminder(avatarId).catch(() => null);
    if (delivery !== null) writeActiveChatId(avatarId, delivery.chatId);
  }

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
