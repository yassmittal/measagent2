/**
 * A question carried from the front page to an avatar's chat as `?ask=`.
 *
 * It only ever fills the composer and is never sent on the visitor's behalf:
 * the line under the composer is how an anonymous visitor learns the owner
 * reads the conversation, so they must see it before their first message goes.
 */
export const ASK_DRAFT_PARAM = 'ask';

// Long enough for any real opening question; a link cannot paste an essay in.
const MAX_ASK_DRAFT_LENGTH = 500;

export function buildAskHref(handle: string, question: string): `/${string}` {
  return `/${handle}?${ASK_DRAFT_PARAM}=${encodeURIComponent(question)}`;
}

export function readAskDraft(value: string | string[] | undefined): string {
  const text = Array.isArray(value) ? value[0] : value;
  return (text ?? '').trim().slice(0, MAX_ASK_DRAFT_LENGTH);
}
