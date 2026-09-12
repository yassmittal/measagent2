import type { FastifyInstance } from 'fastify';
import type { SendMessageRequest } from '@measagent/shared';
import { loadThread } from '../../../handlers/chats/load-thread.js';
import { sendMessage } from '../../../handlers/chats/send-message.js';
import schemas from './schemas.js';

export default async function chatRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post<{ Body: SendMessageRequest }>(
    '/',
    { schema: schemas.sendMessage },
    sendMessage
  );

  fastify.get<{ Params: { chatId: string } }>(
    '/:chatId',
    { schema: schemas.loadThread },
    loadThread
  );
}
