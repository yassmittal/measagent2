import { threadMessage } from '../../chats/schemas.js';

const schemas = Object.freeze({
  deliverReturnReminder: {
    $id: 'deliver-return-reminder',
    tags: ['Reminders'],
    description:
      'Deliver the follow-up an avatar left for the signed-in caller, into their latest ' +
      'conversation with it. Each reminder is delivered once; afterwards, and whenever ' +
      'nothing is waiting, `delivery` is null.',
    body: {
      type: 'object',
      required: ['avatarId'],
      additionalProperties: false,
      properties: { avatarId: { type: 'string' } },
    },
    response: {
      200: {
        type: 'object',
        required: ['delivery'],
        properties: {
          delivery: {
            type: 'object',
            nullable: true,
            required: ['chatId', 'message'],
            properties: { chatId: { type: 'string' }, message: threadMessage },
          },
        },
      },
    },
  },
});

export default schemas;
