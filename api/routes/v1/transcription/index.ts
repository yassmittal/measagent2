import type { FastifyInstance } from 'fastify';
import { createTranscriptionSession } from '../../../handlers/transcription/create-session.js';
import schemas from './schemas.js';

export default async function transcriptionRoutes(
  fastify: FastifyInstance
): Promise<void> {
  fastify.post('/sessions', { schema: schemas.createSession }, createTranscriptionSession);
}
