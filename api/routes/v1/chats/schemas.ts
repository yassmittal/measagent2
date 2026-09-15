import { MAX_PROMPT_LENGTH } from '../../../shared/constants.js';

const tags = ['Chats'];

const threadSummary = {
  type: 'object',
  required: ['id', 'title', 'createdAt', 'lastMessageAt'],
  properties: {
    id: { type: 'string' },
    title: { type: 'string', nullable: true },
    createdAt: { type: 'string' },
    lastMessageAt: { type: 'string' },
  },
} as const;

const threadMessage = {
  type: 'object',
  required: ['id', 'role', 'text', 'status', 'at', 'turnId', 'feedback', 'isReturnReminder'],
  properties: {
    id: { type: 'string' },
    role: { type: 'string', enum: ['user', 'assistant'] },
    text: { type: 'string' },
    status: { type: 'string', enum: ['complete', 'interrupted', 'resolving'] },
    at: { type: 'string' },
    turnId: { type: 'string', nullable: true },
    feedback: { type: 'string', enum: ['up', 'down'], nullable: true },
    isReturnReminder: { type: 'boolean' },
  },
} as const;

export { threadMessage };

const schemas = Object.freeze({
  sendMessage: {
    $id: 'send-message',
    tags,
    description:
      'Send a message and stream the reply back as server-sent events. The ' +
      'response is text/event-stream, so it carries no JSON response schema.',
    body: {
      type: 'object',
      required: ['avatarId', 'text'],
      additionalProperties: false,
      properties: {
        avatarId: {
          type: 'string',
          description: 'The avatar this turn is with. Paused avatars refuse with 409.',
        },
        chatId: {
          type: 'string',
          description:
            'Omit to start a new conversation. Must belong to the caller and to `avatarId`.',
        },
        text: { type: 'string', minLength: 1, maxLength: MAX_PROMPT_LENGTH },
        speak: {
          type: 'boolean',
          default: true,
          description: 'Set false to skip synthesizing the reply.',
        },
      },
    },
  },

  listThreads: {
    $id: 'list-threads',
    tags,
    description:
      "This caller's conversations with one avatar, most recent first. Used to " +
      'find the conversation to reopen after signing in on a new browser.',
    querystring: {
      type: 'object',
      required: ['avatarId'],
      additionalProperties: false,
      properties: { avatarId: { type: 'string' } },
    },
    response: {
      200: {
        type: 'object',
        required: ['chats'],
        properties: { chats: { type: 'array', items: threadSummary } },
      },
    },
  },

  loadThread: {
    $id: 'load-thread',
    tags,
    description: 'Load one conversation and all of its messages.',
    params: {
      type: 'object',
      required: ['chatId'],
      additionalProperties: false,
      properties: { chatId: { type: 'string' } },
    },
    response: {
      200: {
        type: 'object',
        required: ['chat', 'messages'],
        properties: {
          chat: threadSummary,
          messages: { type: 'array', items: threadMessage },
        },
      },
    },
  },
});

export default schemas;
