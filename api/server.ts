import closeWithGrace from 'close-with-grace';
import Fastify from 'fastify';
import app from './app.js';
import corsPlugin from './plugins/cors.js';
import envPlugin from './plugins/env.js';
import indexesPlugin from './plugins/indexes.js';
import mongodbPlugin from './plugins/mongodb.js';
import sensiblePlugin from './plugins/sensible.js';
import swaggerPlugin from './plugins/swagger.js';
import swaggerUIPlugin from './plugins/swaggerUI.js';

const fastify = Fastify({
  logger: { level: process.env.LOG_LEVEL ?? 'info' },
});

// Plugins are registered by hand, in dependency order. Autoloading them would
// leave the order up to filesystem iteration, which is not guaranteed to be
// alphabetical across platforms — and swagger must precede swagger-ui.

// 1. Environment — everything below reads `fastify.config`.
await fastify.register(envPlugin);

// 2. No-dependency utilities.
await fastify.register(sensiblePlugin);
await fastify.register(corsPlugin);

// 3. Storage.
await fastify.register(mongodbPlugin);
await fastify.register(indexesPlugin);

// 4. Docs — swagger before swagger-ui.
await fastify.register(swaggerPlugin);
await fastify.register(swaggerUIPlugin);

// 5. Routes.
await fastify.register(app);

closeWithGrace({ delay: 500 }, async ({ signal, err }) => {
  if (err) fastify.log.error({ err }, 'Fatal error during shutdown');
  fastify.log.info(`Received ${signal}, closing server...`);
  await fastify.close();
});

try {
  const port = Number.parseInt(fastify.config.MA_PORT, 10);
  const host = fastify.config.MA_HOST;
  await fastify.listen({ port, host });
} catch (error) {
  fastify.log.error({ err: error }, 'Server failed to start');
  process.exit(1);
}
