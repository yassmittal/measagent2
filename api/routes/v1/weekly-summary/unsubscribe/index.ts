import type { FastifyInstance } from 'fastify';
import { unsubscribeWeeklySummary } from '../../../../handlers/weekly-summary/unsubscribe-weekly-summary.js';
import schemas from './schemas.js';

export default async function unsubscribeRoutes(fastify: FastifyInstance): Promise<void> {
  // A mail client's one-click unsubscribe posts `List-Unsubscribe=One-Click` as a
  // form. Its content says nothing the token does not, so it is accepted and
  // ignored rather than pulling in a form-body parser for one fixed string.
  fastify.addContentTypeParser('application/x-www-form-urlencoded', (_request, _payload, done) => {
    done(null, undefined);
  });

  fastify.post<{ Querystring: { token: string } }>(
    '/',
    { schema: schemas.unsubscribeWeeklySummary },
    unsubscribeWeeklySummary
  );
}
