import type { FastifyInstance } from 'fastify';
import { acceptConsent } from '../../../handlers/consent/accept-consent.js';
import { loadConsent } from '../../../handlers/consent/load-consent.js';
import schemas from './schemas.js';

export default async function consentRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/', { schema: schemas.loadConsent }, loadConsent);
  fastify.post('/', { schema: schemas.acceptConsent }, acceptConsent);
}
