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
  useState,
} from 'react';
import { useSpeechPlayback } from '@/hooks/useSpeechPlayback';
import { readActiveChatId, writeActiveChatId } from '@/lib/active-chat';
import { loadThread, sendMessage } from '@/lib/chat-client';
import { readVoiceMuted, writeVoiceMuted } from '@/lib/voice-preference';
import {
  type ConversationState,
  conversationReducer,
  INITIAL_STATE,
  isTurnActive,
  pendingMessageId,
} from './conversation-reducer';

interface ConversationContextValue extends ConversationState {
  sendOrQueueMessage: (text: string) => void;
  cancelActiveTurn: () => void;
  clearInputError: () => void;
  isMuted: boolean;
  toggleMuted: () => void;
}

const ConversationContext = createContext<ConversationContextValue | null>(null);

export function ConversationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(conversationReducer, INITIAL_STATE);
  const { enqueueSpan, stopPlayback } = useSpeechPlayback();

  const [isMuted, setMuted] = useState(false);
  useEffect(() => setMuted(readVoiceMuted()), []);

  const chatIdRef = useRef<string | null>(null);
  chatIdRef.current = state.chat?.id ?? null;

  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  const activeTurnRef = useRef<AbortController | null>(null);

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

  const send = useCallback(
    async (text: string) => {
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

      stopPlayback();

      const turnController = new AbortController();
      activeTurnRef.current = turnController;

      try {
        await sendMessage({
          chatId: chatIdRef.current ?? undefined,
          text,
          speak: !isMutedRef.current,
          signal: turnController.signal,
          onEvent: (event) => {
            if (event.type === 'turn_started') writeActiveChatId(event.chat.id);
            if (event.type === 'audio_delta') {
              enqueueSpan(event);
              return;
            }
            dispatch({ type: 'stream_event', event });
          },
        });
      } catch {
        if (turnController.signal.aborted) {
          dispatch({ type: 'turn_cancelled', at: new Date().toISOString() });
        } else {
          dispatch({
            type: 'send_failed',
            message: 'That message did not get through. Try again.',
          });
        }
      } finally {
        if (activeTurnRef.current === turnController) activeTurnRef.current = null;
      }
    },
    [enqueueSpan, stopPlayback],
  );

  const isBusy = isTurnActive(state.turn);

  const sendOrQueueMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (trimmed === '') return;

      if (isBusy) {
        dispatch({ type: 'message_queued', text: trimmed });
        return;
      }
      void send(trimmed);
    },
    [isBusy, send],
  );

  const { queuedText } = state;
  useEffect(() => {
    if (queuedText === null || isBusy) return;
    void send(queuedText);
  }, [queuedText, isBusy, send]);

  const cancelActiveTurn = useCallback(() => {
    activeTurnRef.current?.abort();
    activeTurnRef.current = null;
    stopPlayback();
  }, [stopPlayback]);

  const clearInputError = useCallback(() => dispatch({ type: 'clear_input_error' }), []);

  const toggleMuted = useCallback(() => {
    setMuted((wasMuted) => {
      const muted = !wasMuted;
      writeVoiceMuted(muted);
      if (muted) stopPlayback();
      return muted;
    });
  }, [stopPlayback]);

  const value = useMemo<ConversationContextValue>(
    () => ({
      ...state,
      sendOrQueueMessage,
      cancelActiveTurn,
      clearInputError,
      isMuted,
      toggleMuted,
    }),
    [state, sendOrQueueMessage, cancelActiveTurn, clearInputError, isMuted, toggleMuted],
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
