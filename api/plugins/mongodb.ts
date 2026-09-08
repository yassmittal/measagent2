import mongodb from '@fastify/mongodb';
import fp from 'fastify-plugin';

export default fp(
  async (fastify) => {
    await fastify.register(mongodb, {
      forceClose: true,
      url: fastify.config.MA_DB_CONNECTION_STRING,
      database: fastify.config.MA_DB_NAME,
    });
  },
  { name: 'mongodb', dependencies: ['env'] }
);
