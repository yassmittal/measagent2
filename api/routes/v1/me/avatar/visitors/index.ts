import type { FastifyInstance } from 'fastify';
import { listOwnVisitors } from '../../../../../handlers/visitors/list-own-visitors.js';
import { loadOwnVisitor } from '../../../../../handlers/visitors/load-own-visitor.js';
import schemas from './schemas.js';

export default async function ownVisitorRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/', { schema: schemas.listOwnVisitors }, listOwnVisitors);

  fastify.get<{ Params: { visitorKey: string } }>(
    '/:visitorKey',
    { schema: schemas.loadOwnVisitor },
    loadOwnVisitor
  );
}
