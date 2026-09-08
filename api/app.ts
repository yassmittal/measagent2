import autoLoad from '@fastify/autoload';
import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirName = path.dirname(fileURLToPath(import.meta.url));

/** Autoload every route module, but never the type-only declarations. */
const isLoadableModule = (filePath: string): boolean =>
  /\.(js|ts)$/.test(filePath) && !filePath.endsWith('.d.ts');

/**
 * Plugin registration order is decided explicitly in `server.ts`; this function
 * only mounts the route tree. Directory names become path prefixes, so
 * `routes/v1/chats/index.ts` serves `/v1/chats`.
 */
export default async function app(
  fastify: FastifyInstance,
  opts: FastifyPluginOptions
): Promise<void> {
  await fastify.register(autoLoad, {
    dir: path.join(dirName, 'routes'),
    options: { ...opts },
    matchFilter: isLoadableModule,
  });
}
