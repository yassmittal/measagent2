const FENCED_CODE = /```[\s\S]*?```/g;
const INLINE_CODE = /`([^`]*)`/g;
const MARKDOWN_LINK = /\[([^\]]+)\]\([^)]*\)/g;
const BARE_URL = /https?:\/\/\S+/g;
const EMPHASIS = /(\*\*|__|\*|_)/g;
const HEADING_OR_QUOTE_PREFIX = /^\s{0,3}(#{1,6}|>)\s*/gm;
const LIST_BULLET_PREFIX = /^\s{0,3}[-*+]\s+/gm;
const COLLAPSIBLE_WHITESPACE = /\s+/g;

export function toSpeakableText(markdown: string): string {
  return markdown
    .replace(FENCED_CODE, ' ')
    .replace(INLINE_CODE, '$1')
    .replace(MARKDOWN_LINK, '$1')
    .replace(BARE_URL, ' ')
    .replace(HEADING_OR_QUOTE_PREFIX, '')
    .replace(LIST_BULLET_PREFIX, '')
    .replace(EMPHASIS, '')
    .replace(COLLAPSIBLE_WHITESPACE, ' ')
    .trim();
}
