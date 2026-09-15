import type { FastifyInstance } from 'fastify';
import type { AdminSignInRequest } from '@measagent/shared/admin';
import { signInAdmin } from '../../../../handlers/admin/sign-in-admin.js';
import { ADMIN_SIGN_IN_RATE_LIMIT } from '../../../../shared/constants.js';
import schemas from './schemas.js';

export default async function adminSessionRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post<{ Body: AdminSignInRequest }>(
    '/',
    { schema: schemas.signInAdmin, config: { rateLimit: ADMIN_SIGN_IN_RATE_LIMIT } },
    signInAdmin
  );
}
