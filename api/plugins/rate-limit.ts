import rateLimit from '@fastify/rate-limit';
import fp from 'fastify-plugin';

/**
 * Off by default and switched on per route (`config.rateLimit`), because the
 * only thing worth throttling today is guessing the admin password — a chat
 * turn is already bounded by the model and a global limit would only get in
 * the way of a streaming conversation.
 *
 * Limits are keyed by client address. Behind a proxy that means Fastify's
 * `trustProxy` has to be on, or every request looks like the proxy.
 */
export default fp(
  async (fastify) => {
    await fastify.register(rateLimit, { global: false });
  },
  { name: 'rate-limit' }
);
