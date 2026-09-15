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

/** Recorded with each acceptance. Moving it does not re-ask anyone who already accepted. */
export const CONSENT_TERMS_VERSION = '2026-09-15';

/** Summarising is bookkeeping, not conversation, so it runs on a small model. */
export const MEMORY_MODEL = BEDROCK_MODELS.MINISTRAL_14B_3_0;
/** Summaries one visitor can cost per UTC day, across every avatar. Failed attempts count too. */
export const MEMORY_DAILY_SUMMARY_LIMIT = 20;
/** A follow-up about something weeks old reads as a non sequitur. */
export const RETURN_REMINDER_LIFETIME_DAYS = 14;
/** A reminder that failed to generate is tried again after this long. */
export const RETURN_REMINDER_RETRY_SECONDS = 3600;
export const RETURN_REMINDER_MAX_TOKENS = 200;
/** Long enough for one summary to finish; short enough that a crashed instance's work is picked up soon. */
export const BACKGROUND_LEASE_SECONDS = 120;
/** Relationships a single pass handles, so one pass never outlives the interval by much. */
export const BACKGROUND_BATCH_SIZE = 10;
export const SESSION_LIFETIME_DAYS = 30;
export const THREAD_LIST_LIMIT = 50;
/** How long a hold-to-speak session's routing marker stays valid. */
export const VOICE_SESSION_LIFETIME = '2h';
/** A working session, not a sign-in to keep: short, because it can change what the directory shows. */
export const ADMIN_SESSION_LIFETIME_HOURS = 12;
/** Admin sign-in attempts allowed per client address before it is refused for the window. */
export const ADMIN_SIGN_IN_RATE_LIMIT = Object.freeze({ max: 5, timeWindow: '15 minutes' });
