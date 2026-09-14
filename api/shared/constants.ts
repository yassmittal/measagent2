export const BEDROCK_MODELS = Object.freeze({
  NVIDIA_NEMOTRON_3_SUPER_120B: 'nvidia.nemotron-super-3-120b',
  NEMOTRON_NANO_3_30B: 'nvidia.nemotron-nano-3-30b',
  QWEN3_CODER_NEXT: 'qwen.qwen3-coder-next',
  QWEN3_CODER_480B_A35B_INSTRUCT: 'qwen.qwen3-coder-480b-a35b-instruct',
  GLM_5: 'zai.glm-5',
  MINISTRAL_14B_3_0: 'mistral.ministral-3-14b-instruct',
  DEEPSEEK_3_2: 'deepseek.v3.2',
});

export const DEFAULT_CHAT_MODEL = BEDROCK_MODELS.GLM_5;
export const HISTORY_TURN_LIMIT = 40;
export const MAX_PROMPT_LENGTH = 8000;
export const VOICE_HISTORY_TURN_LIMIT = 8;
export const VOICE_MAX_TOKENS = 220;
export const MAX_SPOKEN_REPLY_LENGTH = 4000;

export const CONSENT_TERMS_VERSION = '2026-09-12';
export const SESSION_LIFETIME_DAYS = 30;
export const THREAD_LIST_LIMIT = 50;
/** How long a hold-to-speak session's routing marker stays valid. */
export const VOICE_SESSION_LIFETIME = '2h';
