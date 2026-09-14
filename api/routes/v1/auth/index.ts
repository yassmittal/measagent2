import type { FastifyInstance } from 'fastify';
import type { GoogleSignInRequest } from '@measagent/shared';
import { loadSession } from '../../../handlers/auth/load-session.js';
import { signInWithGoogle } from '../../../handlers/auth/sign-in-with-google.js';
import schemas from './schemas.js';

export default async function authRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post<{ Body: GoogleSignInRequest }>(
    '/google',
    { schema: schemas.signInWithGoogle },
    signInWithGoogle
  );

  fastify.get('/session', { schema: schemas.loadSession }, loadSession);
}
