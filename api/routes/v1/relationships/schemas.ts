const tags = ['Relationships'];

const avatarParams = {
  type: 'object',
  required: ['avatarId'],
  properties: { avatarId: { type: 'string' } },
} as const;

const stringList = { type: 'array', items: { type: 'string' } } as const;

const schemas = Object.freeze({
  loadRelationship: {
    $id: 'load-relationship',
    tags,
    description:
      'What one avatar remembers about the signed-in caller, and how many messages ' +
      'they have sent it. Memory is null until there is some, and always null ' +
      'before the terms are accepted.',
    params: avatarParams,
    response: {
      200: {
        type: 'object',
        required: ['isMemoryOn', 'userMessageCount', 'memory', 'memoryUpdatedAt'],
        properties: {
          isMemoryOn: { type: 'boolean' },
          userMessageCount: { type: 'integer', minimum: 0 },
          memory: {
            type: 'object',
            nullable: true,
            required: ['summary', 'interests', 'openThreads'],
            properties: {
              summary: { type: 'string' },
              interests: stringList,
              openThreads: stringList,
            },
          },
          memoryUpdatedAt: { type: 'string', nullable: true },
        },
      },
    },
  },

  forgetRelationship: {
    $id: 'forget-relationship',
    tags,
    description:
      'One avatar forgets the signed-in caller. Conversations are kept, but ' +
      'nothing already said is ever read back into memory.',
    params: avatarParams,
    response: { 204: { type: 'null' } },
  },

  forgetAllRelationships: {
    $id: 'forget-all-relationships',
    tags,
    description: 'Every avatar forgets the signed-in caller. Conversations are kept.',
    response: { 204: { type: 'null' } },
  },
});

export default schemas;
