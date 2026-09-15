'use client';

import type { ThreadMessage } from '@measagent/shared';
import type { AvatarProfile } from '@measagent/shared/avatars';
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
import { type LiveVoiceSession, useLiveVoice } from '@/hooks/useLiveVoice';
import { useSpeechPlayback } from '@/hooks/useSpeechPlayback';
import { writeActiveChatId } from '@/lib/active-chat';
import { loadThread, sendMessage } from '@/lib/chat-client';
import { loadInitialThread } from '@/lib/initial-thread';
import { readVoiceMuted, writeVoiceMuted } from '@/lib/voice-preference';
import {
  type ConversationState,
  conversationReducer,
  INITIAL_STATE,
  isTurnActive,
  pendingMessageId,
} from './conversation-reducer';
import { useSession } from './SessionProvider';

interface ConversationContextValue extends ConversationState {
  /** Who this conversation is with. Read by everything that names them. */
  avatar: AvatarProfile;
  sendOrQueueMessage: (text: string) => void;
  cancelActiveTurn: () => void;
  clearInputError: () => void;
  /** Hold-to-speak. The voice service owns the audio; this owns the words. */
  voice: LiveVoiceSession;
  isMuted: boolean;
  toggleMuted: () => void;
}

const ConversationContext = createContext<ConversationContextValue | null>(null);

interface ConversationProviderProps {
  avatar: AvatarProfile;
  children: ReactNode;
}

export function ConversationProvider({ avatar, children }: ConversationProviderProps) {
  const [state, dispatch] = useReducer(conversationReducer, INITIAL_STATE);
  const { identityKey, isSignedIn } = useSession();
  const { enqueueSpan, stopPlayback } = useSpeechPlayback();

  const [isMuted, setMuted] = useState(false);
  useEffect(() => setMuted(readVoiceMuted()), []);

  const chatIdRef = useRef<string | null>(null);
  chatIdRef.current = state.chat?.id ?? null;

  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  const activeTurnRef = useRef<AbortController | null>(null);

  const avatarId = avatar.id;

  useEffect(() => {
    if (identityKey === null) return;

    let cancelled = false;
    dispatch({ type: 'identity_changed' });

    loadInitialThread(avatarId, isSignedIn)
      .then((thread) => {
        if (cancelled) return;
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
  }, [avatarId, identityKey, isSignedIn]);

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
          avatarId,
          chatId: chatIdRef.current ?? undefined,
          text,
          speak: !isMutedRef.current,
          signal: turnController.signal,
          onEvent: (event) => {
            if (event.type === 'turn_started') writeActiveChatId(avatarId, event.chat.id);
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
    [avatarId, enqueueSpan, stopPlayback],
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

  const refreshThread = useCallback(async () => {
    const chatId = chatIdRef.current;
    if (chatId === null) return;

    const thread = await loadThread(chatId).catch(() => null);
    if (thread === null) return;
    dispatch({ type: 'thread_loaded', chat: thread.chat, messages: thread.messages });
  }, []);

  // A spoken turn is written to the database by the voice service, not by this
  // browser — so the words are shown optimistically as they arrive, then the
  // thread is re-read to replace them with what was actually stored.
  const voice = useLiveVoice({
    threadId: state.chat?.id ?? null,
    onUserSpoke: (text) => {
      stopPlayback();
      dispatch({
        type: 'voice_user_spoke',
        message: {
          id: pendingMessageId(),
          role: 'user',
          text,
          status: 'complete',
          at: new Date().toISOString(),
          turnId: null,
          feedback: null,
        },
      });
    },
    onReplyDelta: (text) => dispatch({ type: 'voice_reply_delta', text }),
    onReplyCompleted: () => {
      dispatch({ type: 'voice_turn_completed' });
      void refreshThread();
    },
  });

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
      avatar,
      sendOrQueueMessage,
      cancelActiveTurn,
      clearInputError,
      voice,
      isMuted,
      toggleMuted,
    }),
    [
      state,
      avatar,
      sendOrQueueMessage,
      cancelActiveTurn,
      clearInputError,
      voice,
      isMuted,
      toggleMuted,
    ],
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
