import type { VisitorMemory } from '@measagent/shared';

/**
 * The follow-up an avatar leaves for a visitor who went away with something
 * unfinished. It is generated in the avatar's own voice — the system prompt is
 * the ordinary persona prompt, memory included — so this file only supplies the
 * request and decides what may be shown.
 */

export const RETURN_REMINDER_MAX_LENGTH = 400;

export function isReturnReminderWorthWriting(memory: VisitorMemory | null): memory is VisitorMemory {
  return memory !== null && memory.openThreads.length > 0;
}

/** Sent as the visitor's turn, because the persona prompt already says who is speaking to whom. */
export function buildReturnReminderRequest(memory: VisitorMemory): string {
  return `[This is not a message from the visitor. They have been away for a while, and this is the first thing they will see when they come back.]

Write one short, friendly message (one to three sentences) that picks up something they left unfinished, from this list:
${memory.openThreads.map((openThread) => `- ${openThread}`).join('\n')}

Speak to them directly, as you would in the conversation. Do not say you were "reminded" or mention notes or memory, do not ask whether they remember you, and do not add a greeting longer than a word or two.`;
}

/** Throws when there is nothing worth showing, so nothing is stored. */
export function cleanReturnReminderText(raw: string): string {
  const text = raw
    .replace(/<\/?[a-z_][a-z0-9_-]*\s*>/gi, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
  if (text === '') throw new Error('The return reminder came back empty');
  return text.length <= RETURN_REMINDER_MAX_LENGTH
    ? text
    : `${text.slice(0, RETURN_REMINDER_MAX_LENGTH - 1).trimEnd()}…`;
}
