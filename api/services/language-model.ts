import { ChatOpenAI } from '@langchain/openai';
import { DEFAULT_CHAT_MODEL } from '../shared/constants.js';

/**
 * Amazon Bedrock's OpenAI-compatible gateway. Every model in
 * `BEDROCK_MODELS` is served from this one base URL against the Bedrock API
 * key, so `ChatOpenAI` is the client for all of them — there is no per-provider
 * SDK to install.
 *
 * Overridable so the service can be pointed at any OpenAI-compatible endpoint
 * — a local stub in tests, or a different gateway — without a code change.
 */
const DEFAULT_BEDROCK_BASE_URL = 'https://bedrock-mantle.us-east-1.api.aws/v1';

const bedrockBaseUrl = (): string =>
  process.env.BEDROCK_BASE_URL || DEFAULT_BEDROCK_BASE_URL;

const DEFAULT_MODEL_PARAMS = Object.freeze({
  temperature: 0.6,
  maxTokens: 2048,
  maxRetries: 2,
});

export interface ChatModelOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  maxRetries?: number;
}

export function isChatModelConfigured(): boolean {
  return Boolean(process.env.BEDROCK_API_KEY);
}

/** Build the conversational model that speaks as the avatar. */
export function buildChatModel(options: ChatModelOptions = {}): ChatOpenAI {
  const apiKey = process.env.BEDROCK_API_KEY;
  if (!apiKey) {
    throw new Error('BEDROCK_API_KEY is not configured');
  }

  const {
    model = DEFAULT_CHAT_MODEL,
    temperature = DEFAULT_MODEL_PARAMS.temperature,
    maxTokens = DEFAULT_MODEL_PARAMS.maxTokens,
    maxRetries = DEFAULT_MODEL_PARAMS.maxRetries,
  } = options;

  return new ChatOpenAI({
    model,
    apiKey,
    configuration: { baseURL: bedrockBaseUrl() },
    temperature,
    maxTokens,
    maxRetries,
    streaming: true,
  });
}

export { DEFAULT_BEDROCK_BASE_URL, bedrockBaseUrl };
