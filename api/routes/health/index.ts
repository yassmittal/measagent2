import type { FastifyInstance } from 'fastify';

export default async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    '/',
    {
      schema: {
        tags: ['Health'],
        description: 'Liveness probe.',
        response: {
          200: {
            type: 'object',
            required: ['status'],
            properties: { status: { type: 'string' } },
          },
        },
      },
    },
    async () => ({ status: 'ok' })
  );
}
