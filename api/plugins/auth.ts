import { randomBytes } from 'node:crypto';
import jwt from '@fastify/jwt';
import fp from 'fastify-plugin';
import { SESSION_LIFETIME_DAYS } from '../shared/constants.js';

/**
 * The session token this service issues once a Google credential checks out.
 *
 * It is a signed token rather than a row in a sessions collection because the
 * only thing a request needs to establish is which owner is calling, and a
 * signature answers that without a database round trip on every message. The
 * price is that signing out cannot be enforced here — a copied token stays
 * valid until it expires — which is why the lifetime is finite rather than
 * indefinite. If revocation is ever needed, this is the file that grows a
 * denylist.
 *
 * The browser sends it as `Authorization: Bearer` rather than a cookie: the api
 * is on a different origin from the web app, and browsers are removing exactly
 * the third-party cookie behaviour that would require.
 */
export default fp(
  async (fastify) => {
    const configuredSecret = fastify.config.MA_SESSION_SECRET;

    await fastify.register(jwt, {
      // Without a configured secret no token can ever be issued — the sign-in
      // route refuses first — so this throwaway keeps the decorator's type
      // honest rather than standing in for a real key.
      secret: configuredSecret === '' ? randomBytes(32).toString('hex') : configuredSecret,
      sign: { expiresIn: `${SESSION_LIFETIME_DAYS}d` },
    });

    if (configuredSecret === '') {
      fastify.log.warn(
        'MA_SESSION_SECRET is not set — Google sign-in is disabled and every ' +
          'conversation stays anonymous.'
      );
    }
  },
  { name: 'auth', dependencies: ['env'] }
);
