import type {
  ChatStreamEvent,
  LoadThreadResponse,
  SendMessageRequest,
} from '@measagent/shared';
import { readDeviceId } from './device-id';


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3010';

export class ChatRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ChatRequestError';
  }
}

function requestHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-device-id': readDeviceId(),
  };
}

export async function loadThread(chatId: string): Promise<LoadThreadResponse | null> {
  const response = await fetch(`${API_BASE_URL}/v1/chats/${chatId}`, {
    headers: requestHeaders(),
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new ChatRequestError('Could not load the conversation', response.status);
  }

  return (await response.json()) as LoadThreadResponse;
}

export interface SendMessageOptions extends SendMessageRequest {
  onEvent: (event: ChatStreamEvent) => void;
  signal?: AbortSignal;
}

export async function sendMessage(options: SendMessageOptions): Promise<void> {
  const { onEvent, signal, ...body } = options;

  const response = await fetch(`${API_BASE_URL}/v1/chats`, {
    method: 'POST',
    headers: requestHeaders(),
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok || response.body === null) {
    throw new ChatRequestError('Could not reach the avatar', response.status);
  }

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += value;

    const frames = buffer.split('\n\n');
    buffer = frames.pop() ?? '';

    for (const frame of frames) {
      const payload = frame
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice('data:'.length).trim())
        .join('');

      if (payload === '' || payload === '[DONE]') continue;

      try {
        onEvent(JSON.parse(payload) as ChatStreamEvent);
      } catch {
        // A frame we cannot parse is a bug on the wire, not a reason to tear
        // down a turn that is otherwise streaming fine.
      }
    }
  }
}
