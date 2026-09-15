import type { FastifyInstance } from 'fastify';
import {
  forgetAllRelationships,
  forgetRelationship,
} from '../../../handlers/relationships/forget-relationships.js';
import { loadRelationship } from '../../../handlers/relationships/load-relationship.js';
import schemas from './schemas.js';

export default async function relationshipRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get<{ Params: { avatarId: string } }>(
    '/:avatarId',
    { schema: schemas.loadRelationship },
    loadRelationship
  );

  fastify.delete<{ Params: { avatarId: string } }>(
    '/:avatarId',
    { schema: schemas.forgetRelationship },
    forgetRelationship
  );

  fastify.delete('/', { schema: schemas.forgetAllRelationships }, forgetAllRelationships);
}
