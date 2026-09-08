import type { FastifyInstance } from 'fastify';
import { chatCompletions } from '../../../handlers/voice/chat-completions.js';
import schemas from './schemas.js';

export default async function chatCompletionRoutes(
  fastify: FastifyInstance
): Promise<void> {
  fastify.post('/completions', { schema: schemas.chatCompletions }, chatCompletions);
}
