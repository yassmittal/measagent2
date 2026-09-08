'use client';

import type { ThreadMessage } from '@measagent/shared';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import { readActiveChatId, writeActiveChatId } from '@/lib/active-chat';
import { loadThread, sendMessage } from '@/lib/chat-client';
import {
  type ConversationState,
  conversationReducer,
  INITIAL_STATE,
  pendingMessageId,
} from './conversation-reducer';

interface ConversationContextValue extends ConversationState {
  sendMessage: (text: string) => Promise<void>;
  clearInputError: () => void;
}

const ConversationContext = createContext<ConversationContextValue | null>(null);

export function ConversationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(conversationReducer, INITIAL_STATE);

  const chatIdRef = useRef<string | null>(null);
  chatIdRef.current = state.chat?.id ?? null;

  useEffect(() => {
    const chatId = readActiveChatId();
    if (chatId === null) {
      dispatch({ type: 'thread_loaded', chat: null, messages: [] });
      return;
    }

    let cancelled = false;
    loadThread(chatId)
      .then((thread) => {
        if (cancelled) return;
        if (thread === null) writeActiveChatId(null);
        dispatch({
          type: 'thread_loaded',
          chat: thread?.chat ?? null,
          messages: thread?.messages ?? [],
        });
      })
      .catch(() => {
        if (cancelled) return;
        dispatch({ type: 'thread_loaded', chat: null, messages: [] });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const send = useCallback(async (text: string) => {
    const optimisticMessage: ThreadMessage = {
      id: pendingMessageId(),
      role: 'user',
      text,
      status: 'complete',
      at: new Date().toISOString(),
      turnId: null,
      feedback: null,
    };
    dispatch({ type: 'send_started', optimisticMessage });

    try {
      await sendMessage({
        chatId: chatIdRef.current ?? undefined,
        text,
        onEvent: (event) => {
          if (event.type === 'turn_started') writeActiveChatId(event.chat.id);
          dispatch({ type: 'stream_event', event });
        },
      });
    } catch {
      dispatch({
        type: 'send_failed',
        message: 'That message did not get through. Try again.',
      });
    }
  }, []);

  const clearInputError = useCallback(() => dispatch({ type: 'clear_input_error' }), []);

  const value = useMemo<ConversationContextValue>(
    () => ({ ...state, sendMessage: send, clearInputError }),
    [state, send, clearInputError],
  );

  return (
    <ConversationContext.Provider value={value}>{children}</ConversationContext.Provider>
  );
}

export function useConversation(): ConversationContextValue {
  const value = useContext(ConversationContext);
  if (value === null) {
    throw new Error('useConversation must be used inside a ConversationProvider');
  }
  return value;
}
