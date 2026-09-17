import {
  AVATAR_ASK_ME_ABOUT_MAX_TOPICS,
  type AvatarPublicDetails,
} from '@measagent/shared/avatars';
import type { AvatarDoc } from '../../shared/documents.js';

/** The public details of an avatar, with defaults for documents that predate them. */
export function readAvatarPublicDetails(avatar: AvatarDoc): AvatarPublicDetails {
  return {
    subject: avatar.subject ?? 'person',
    askMeAbout: avatar.askMeAbout ?? [],
    websiteUrl: avatar.websiteUrl ?? null,
  };
}

export function isAvatarHiddenFromSearch(avatar: AvatarDoc): boolean {
  return avatar.isHiddenFromSearch ?? false;
}

/**
 * Whether search engines may be told about an avatar's page. Decided here and
 * nowhere else: the sitemap, the page's robots tag and the api response all
 * start from this answer.
 *
 * Only avatars the directory lists and that are live, and only while the owner
 * has not turned search off. A link still works either way.
 */
export function isAvatarSearchIndexable(avatar: AvatarDoc): boolean {
  return (
    avatar.listing === 'listed' &&
    avatar.availability === 'live' &&
    !isAvatarHiddenFromSearch(avatar)
  );
}

/** Trimmed, without blanks or case-insensitive repeats, capped at the limit. */
export function normalizeAskMeAboutTopics(topics: string[]): string[] {
  const seenTopics = new Set<string>();
  const normalizedTopics: string[] = [];

  for (const topic of topics) {
    const trimmedTopic = topic.trim();
    const topicKey = trimmedTopic.toLowerCase();
    if (trimmedTopic === '' || seenTopics.has(topicKey)) continue;

    seenTopics.add(topicKey);
    normalizedTopics.push(trimmedTopic);
  }
  return normalizedTopics.slice(0, AVATAR_ASK_ME_ABOUT_MAX_TOPICS);
}

/** An empty field means no website. */
export function normalizeWebsiteUrl(input: string | null): string | null {
  const trimmedUrl = input?.trim() ?? '';
  return trimmedUrl === '' ? null : trimmedUrl;
}

/**
 * The JSON schema already requires `https://` and no whitespace; this adds what
 * a pattern cannot say cleanly — that it parses, and names a real-looking host.
 */
export function isAcceptableWebsiteUrl(url: string): boolean {
  if (!URL.canParse(url)) return false;

  const { protocol, hostname, username, password } = new URL(url);
  return (
    protocol === 'https:' &&
    hostname.includes('.') &&
    // Credentials in a link shown to strangers are either a mistake or a trick.
    username === '' &&
    password === ''
  );
}
