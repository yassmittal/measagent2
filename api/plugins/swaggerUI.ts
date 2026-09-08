import swaggerUI from '@fastify/swagger-ui';
import fp from 'fastify-plugin';

export default fp(
  async (fastify) => {
    await fastify.register(swaggerUI, { routePrefix: '/docs' });
  },
  { name: 'swaggerUI', dependencies: ['swagger'] }
);
