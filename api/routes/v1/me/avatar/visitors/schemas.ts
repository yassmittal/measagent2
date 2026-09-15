import { threadMessage, threadSummary } from '../../../chats/schemas.js';
import { visitorMemory } from '../../../relationships/schemas.js';

const tags = ['Visitors'];

const ownerVisitor = {
  type: 'object',
  required: [
    'key',
    'kind',
    'name',
    'pictureUrl',
    'conversationCount',
    'messageCount',
    'firstSeenAt',
    'lastSeenAt',
    'memory',
    'needsAttention',
  ],
  properties: {
    key: { type: 'string' },
    kind: { type: 'string', enum: ['account', 'anonymous'] },
    name: { type: 'string' },
    pictureUrl: { type: 'string', nullable: true },
    conversationCount: { type: 'integer', minimum: 0 },
    messageCount: { type: 'integer', minimum: 0 },
    firstSeenAt: { type: 'string' },
    lastSeenAt: { type: 'string' },
    memory: visitorMemory,
    needsAttention: {
      type: 'object',
      nullable: true,
      required: ['category', 'reason'],
      properties: {
        category: {
          type: 'string',
          enum: ['wants_to_reach_you', 'business_enquiry', 'deferred_to_you', 'complaint', 'safety_concern'],
        },
        reason: { type: 'string' },
      },
    },
  },
} as const;

const schemas = Object.freeze({
  listOwnVisitors: {
    $id: 'list-own-visitors',
    tags,
    description:
      "Everyone the signed-in owner may see talking to their avatar, most recently " +
      'seen first. Excludes the owner themselves, accounts that have not accepted ' +
      'the terms, and anonymous conversations started before visitors were told ' +
      'the owner reads them — those are only counted.',
    response: {
      200: {
        type: 'object',
        required: ['visitors', 'hiddenConversationCount'],
        properties: {
          visitors: { type: 'array', items: ownerVisitor },
          hiddenConversationCount: { type: 'integer', minimum: 0 },
        },
      },
    },
  },

  loadOwnVisitor: {
    $id: 'load-own-visitor',
    tags,
    description:
      "One of the owner's visitors and every conversation with them the owner may " +
      'see, oldest first. Read-only.',
    params: {
      type: 'object',
      required: ['visitorKey'],
      additionalProperties: false,
      properties: { visitorKey: { type: 'string' } },
    },
    response: {
      200: {
        type: 'object',
        required: ['visitor', 'conversations'],
        properties: {
          visitor: ownerVisitor,
          conversations: {
            type: 'array',
            items: {
              type: 'object',
              required: ['chat', 'messages'],
              properties: {
                chat: threadSummary,
                messages: { type: 'array', items: threadMessage },
              },
            },
          },
        },
      },
    },
  },
});

export default schemas;
