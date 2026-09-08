import swagger from '@fastify/swagger';
import fp from 'fastify-plugin';

export default fp(
  async (fastify) => {
    await fastify.register(swagger, {
      openapi: {
        info: {
          title: 'meAsAgent API',
          description: 'Chat, voice and memory for the meAsAgent avatar.',
          version: '0.1.0',
        },
      },
    });
  },
  { name: 'swagger' }
);
