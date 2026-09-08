import cors from '@fastify/cors';
import fp from 'fastify-plugin';
import { DEVICE_ID_HEADER } from '../shared/identity.js';

/**
 * The browser talks to this service directly (that is the point — audio and
 * token streams must not take an extra hop), so CORS is load-bearing rather
 * than incidental. Origins come from env; there is no wildcard fallback.
 */
export default fp(
  async (fastify) => {
    const origins = fastify.config.MA_WEB_ORIGIN.split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin !== '');

    await fastify.register(cors, {
      origin: origins,
      credentials: true,
      allowedHeaders: ['content-type', DEVICE_ID_HEADER],
    });
  },
  { name: 'cors', dependencies: ['env'] }
);
