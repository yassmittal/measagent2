import type {
  ChatStreamEvent,
  ThreadMessage,
  ThreadSummary,
  VoiceUnavailableReason,
} from '@measagent/shared';

export type TurnPhase = 'idle' | 'sending' | 'streaming' | 'failed';

export interface TurnState {
  phase: TurnPhase;
  turnId: string | null;
  replyMessageId: string | null;
  text: string;
  failure: string | null;
}

export interface ConversationState {
  chat: ThreadSummary | null;
  messages: ThreadMessage[];
  turn: TurnState;
  isLoading: boolean;
  inputError: string | null;
  voiceNotice: string | null;
  queuedText: string | null;
}

const VOICE_NOTICES: Record<VoiceUnavailableReason, string> = {
  not_configured: 'Spoken replies are not switched on yet.',
  synthesis_failed: 'The voice dropped out — the reply is all here.',
};

export const IDLE_TURN: TurnState = {
  phase: 'idle',
  turnId: null,
  replyMessageId: null,
  text: '',
  failure: null,
};

export const INITIAL_STATE: ConversationState = {
  chat: null,
  messages: [],
  turn: IDLE_TURN,
  isLoading: true,
  inputError: null,
  voiceNotice: null,
  queuedText: null,
};

const PENDING_ID_PREFIX = 'pending:';

export const pendingMessageId = (): string =>
  `${PENDING_ID_PREFIX}${crypto.randomUUID()}`;

export const isPendingMessage = (message: ThreadMessage): boolean =>
  message.id.startsWith(PENDING_ID_PREFIX);

export type ConversationAction =
  | { type: 'thread_loaded'; chat: ThreadSummary | null; messages: ThreadMessage[] }
  | { type: 'send_started'; optimisticMessage: ThreadMessage }
  | { type: 'stream_event'; event: ChatStreamEvent }
  | { type: 'send_failed'; message: string }
  | { type: 'turn_cancelled'; at: string }
  | { type: 'voice_user_spoke'; message: ThreadMessage }
  | { type: 'voice_reply_delta'; text: string }
  | { type: 'voice_turn_completed' }
  | { type: 'message_queued'; text: string }
  | { type: 'input_error'; message: string }
  | { type: 'clear_input_error' };

export function conversationReducer(
  state: ConversationState,
  action: ConversationAction,
): ConversationState {
  switch (action.type) {
    case 'thread_loaded':
      return {
        ...state,
        chat: action.chat,
        messages: action.messages,
        isLoading: false,
      };

    case 'send_started':
      return {
        ...state,
        messages: [...state.messages, action.optimisticMessage],
        turn: { ...IDLE_TURN, phase: 'sending' },
        queuedText: null,
        inputError: null,
        voiceNotice: null,
      };

    case 'stream_event':
      return applyStreamEvent(state, action.event);

    case 'send_failed':
      return {
        ...state,
        messages: state.messages.filter((message) => !isPendingMessage(message)),
        turn: { ...IDLE_TURN, phase: 'failed', failure: action.message },
      };

    case 'turn_cancelled':
      return {
        ...state,
        messages: [...state.messages, ...stoppedReplyOf(state.turn, action.at)],
        turn: IDLE_TURN,
      };

    case 'message_queued':
      return { ...state, queuedText: action.text, inputError: null };

    // A spoken turn reuses the typed turn's shape so the thread renders one way
    // for both. It carries no turnId: the voice service owns the turn, so there
    // is no open request here for a Stop button to abort.
    case 'voice_user_spoke':
      return {
        ...state,
        messages: [...state.messages, action.message],
        turn: { ...IDLE_TURN, phase: 'streaming' },
        inputError: null,
      };

    case 'voice_reply_delta':
      return { ...state, turn: { ...state.turn, text: state.turn.text + action.text } };

    case 'voice_turn_completed':
      return { ...state, turn: IDLE_TURN };

    case 'input_error':
      return { ...state, inputError: action.message };

    case 'clear_input_error':
      return { ...state, inputError: null };
  }
}

function applyStreamEvent(
  state: ConversationState,
  event: ChatStreamEvent,
): ConversationState {
  switch (event.type) {
    case 'turn_started':
      return {
        ...state,
        chat: event.chat,
        messages: [
          ...state.messages.filter((message) => !isPendingMessage(message)),
          event.userMessage,
        ],
        turn: {
          ...IDLE_TURN,
          phase: 'streaming',
          turnId: event.turnId,
          replyMessageId: event.replyMessageId,
        },
      };

    case 'delta':
      return { ...state, turn: { ...state.turn, text: state.turn.text + event.text } };

    case 'turn_completed':
      return {
        ...state,
        messages: [...state.messages, event.message],
        turn: IDLE_TURN,
      };

    case 'turn_failed':
      return {
        ...state,
        turn: { ...state.turn, phase: 'failed', failure: event.message },
      };

    case 'voice_unavailable':
      return { ...state, voiceNotice: VOICE_NOTICES[event.reason] };

    case 'audio_delta':
    case 'audio_done':
      return state;
  }
}

function stoppedReplyOf(turn: TurnState, at: string): ThreadMessage[] {
  if (turn.replyMessageId === null || turn.text === '') return [];

  return [
    {
      id: turn.replyMessageId,
      role: 'assistant',
      text: turn.text,
      status: 'interrupted',
      at,
      turnId: turn.turnId,
      feedback: null,
    },
  ];
}

export const isTurnActive = (turn: TurnState): boolean =>
  turn.phase === 'sending' || turn.phase === 'streaming';
