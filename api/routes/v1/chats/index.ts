import type { FastifyInstance } from 'fastify';
import type { ListThreadsQuery, SendMessageRequest } from '@measagent/shared';
import { listThreads } from '../../../handlers/chats/list-threads.js';
import { loadThread } from '../../../handlers/chats/load-thread.js';
import { sendMessage } from '../../../handlers/chats/send-message.js';
import schemas from './schemas.js';

export default async function chatRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post<{ Body: SendMessageRequest }>(
    '/',
    { schema: schemas.sendMessage },
    sendMessage
  );

  fastify.get<{ Querystring: ListThreadsQuery }>(
    '/',
    { schema: schemas.listThreads },
    listThreads
  );

  fastify.get<{ Params: { chatId: string } }>(
    '/:chatId',
    { schema: schemas.loadThread },
    loadThread
  );
}
