import env from '@fastify/env';
import fp from 'fastify-plugin';

/**
 * The one place `process.env` is read into a validated shape. Everything the
 * service needs to boot is `required`; everything a later stage will need has a
 * default of `''` so a Stage 1 deployment starts without Stage 3 credentials.
 */
export default fp(
  async (fastify) => {
    await fastify.register(env, {
      dotenv: true,
      schema: {
        type: 'object',
        required: ['MA_DB_CONNECTION_STRING', 'MA_DB_NAME', 'BEDROCK_API_KEY'],
        properties: {
          MA_HOST: { type: 'string', default: '127.0.0.1' },
          MA_PORT: { type: 'string', default: '3010' },
          MA_DB_CONNECTION_STRING: { type: 'string' },
          MA_DB_NAME: { type: 'string' },
          /** Comma-separated origins allowed to call the api from a browser. */
          MA_WEB_ORIGIN: { type: 'string', default: 'http://localhost:3000' },
          NODE_ENV: { type: 'string', default: 'development' },
          LOG_LEVEL: { type: 'string', default: 'info' },

          BEDROCK_API_KEY: { type: 'string' },
          BEDROCK_REGION: { type: 'string', default: 'us-east-1' },
          /** Override only to target a different OpenAI-compatible gateway. */
          BEDROCK_BASE_URL: { type: 'string', default: '' },

          // Stage 2 — Kokoro text-to-speech through the HuggingFace router.
          HF_TOKEN: { type: 'string', default: '' },
          // Stage 3 — the standalone speech-to-speech service's bearer token.
          MA_S2S_API_KEY: { type: 'string', default: '' },

          // Stage 4 — Google sign-in. Both are needed before anyone can sign
          // in; with either missing the service still runs, anonymously.
          MA_SESSION_SECRET: { type: 'string', default: '' },
          MA_GOOGLE_CLIENT_ID: { type: 'string', default: '' },
        },
      },
    });
  },
  { name: 'env' }
);
