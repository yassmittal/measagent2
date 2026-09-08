import sensible from '@fastify/sensible';
import fp from 'fastify-plugin';

/**
 * Adds the `reply.badRequest(...)` family. Every error path in this service
 * goes through those helpers rather than a bare `throw new Error`.
 *
 * @see https://github.com/fastify/fastify-sensible
 */
export default fp(
  async (fastify) => {
    await fastify.register(sensible, { sharedSchemaId: 'http-errors' });
  },
  { name: 'sensible' }
);
