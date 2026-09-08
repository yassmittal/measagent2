/**
 * Models reachable through the Amazon Bedrock OpenAI-compatible gateway.
 * Kept as a frozen map rather than a bare string so a model swap is one edit
 * and every call site names the model it wants.
 */
export const BEDROCK_MODELS = Object.freeze({
  NVIDIA_NEMOTRON_3_SUPER_120B: 'nvidia.nemotron-super-3-120b',
  NEMOTRON_NANO_3_30B: 'nvidia.nemotron-nano-3-30b',
  QWEN3_CODER_NEXT: 'qwen.qwen3-coder-next',
  QWEN3_CODER_480B_A35B_INSTRUCT: 'qwen.qwen3-coder-480b-a35b-instruct',
  GLM_5: 'zai.glm-5',
  MINISTRAL_14B_3_0: 'mistral.ministral-3-14b-instruct',
  DEEPSEEK_3_2: 'deepseek.v3.2',
});

/** The conversational model behind the avatar. */
export const DEFAULT_CHAT_MODEL = BEDROCK_MODELS.GLM_5;

/**
 * How many prior messages are replayed to the model. The reference product
 * pages its thread rather than sending all of it, and an unbounded history is
 * the fastest way to a context-length failure on a long-lived conversation.
 */
export const HISTORY_TURN_LIMIT = 40;

/** Longest prompt accepted from the composer, in characters. */
export const MAX_PROMPT_LENGTH = 8000;
