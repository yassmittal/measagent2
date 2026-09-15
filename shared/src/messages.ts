export type MessageRole = 'user' | 'assistant';
export type MessageStatus = 'complete' | 'interrupted' | 'resolving';

export type FeedbackVote = 'up' | 'down';

export interface ThreadMessage {
  id: string;
  role: MessageRole;
  text: string;
  status: MessageStatus;
  at: string;
  turnId: string | null;
  feedback: FeedbackVote | null;
}

export interface ThreadSummary {
  id: string;
  title: string | null;
  createdAt: string;
  lastMessageAt: string;
}

export interface SendMessageRequest {
  /** Which avatar this turn is with. Names the avatar; never shapes it. */
  avatarId: string;
  chatId?: string;
  text: string;
  speak?: boolean;
}

export interface ListThreadsQuery {
  avatarId: string;
}

export interface LoadThreadResponse {
  chat: ThreadSummary;
  messages: ThreadMessage[];
}

export interface ListThreadsResponse {
  chats: ThreadSummary[];
}
