import type { FastifyInstance } from 'fastify';

/**
 * Every decorator this service adds is declared here. Add to this file rather
 * than reaching for `as any` at the call site — an undeclared decorator loses
 * type checking for the whole handler it is used in.
 */
declare module 'fastify' {
  interface FastifyInstance {
    config: {
      MA_HOST: string;
      MA_PORT: string;
      MA_DB_CONNECTION_STRING: string;
      MA_DB_NAME: string;
      MA_WEB_ORIGIN: string;
      NODE_ENV: string;
      LOG_LEVEL: string;
      BEDROCK_API_KEY: string;
      BEDROCK_REGION: string;
      BEDROCK_BASE_URL: string;
      HF_TOKEN: string;
      MA_S2S_API_KEY: string;
      MA_SESSION_SECRET: string;
      MA_GOOGLE_CLIENT_ID: string;
    };
  }
}

export type { FastifyInstance };
