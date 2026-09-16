import type { MetadataRoute } from 'next';
import { COMPARISONS } from '@/content/comparisons';
import type { ContentPageCopy } from '@/content/content-types';
import { GUIDES } from '@/content/guides';
import { HOW_IT_WORKS_PAGE } from '@/content/how-it-works';
import { PRIVACY_UPDATED_AT, TERMS_UPDATED_AT } from '@/content/legal-dates';
import { PERSONA_PAGES } from '@/content/personas';
import { loadAvatarDirectory } from '@/lib/avatar-profiles';
import { shouldIndexAvatarPage } from './avatar-search';
import { toAbsoluteUrl } from './structured-data';

type SitemapEntry = MetadataRoute.Sitemap[number];

/**
 * One function per source of URLs. When the avatars outgrow a single file
 * (50,000 URLs), `generateSitemaps` can give each source — or each slice of
 * avatars — its own sitemap without these changing.
 */

export function listContentSitemapEntries(): SitemapEntry[] {
  const contentPages: ContentPageCopy[] = [
    HOW_IT_WORKS_PAGE,
    ...Object.values(PERSONA_PAGES),
    ...Object.values(GUIDES),
    ...Object.values(COMPARISONS),
  ];

  return [
    ...contentPages.map((page) => ({
      url: toAbsoluteUrl(page.path),
      lastModified: page.updatedAt,
    })),
    { url: toAbsoluteUrl('/launch') },
    { url: toAbsoluteUrl('/privacy'), lastModified: PRIVACY_UPDATED_AT },
    { url: toAbsoluteUrl('/terms'), lastModified: TERMS_UPDATED_AT },
  ];
}

/**
 * The front page and every avatar page search engines may list. Starts from the
 * directory — only reviewed, live avatars — and keeps those whose page would not
 * say `noindex`, so the sitemap never offers a page the page itself refuses.
 */
export async function listDirectorySitemapEntries(): Promise<SitemapEntry[]> {
  const avatars = await loadAvatarDirectory();
  const indexableAvatars = avatars.filter(shouldIndexAvatarPage);

  const newestAvatarUpdate = indexableAvatars
    .map((avatar) => avatar.updatedAt)
    .sort()
    .at(-1);

  return [
    {
      url: toAbsoluteUrl('/'),
      ...(newestAvatarUpdate ? { lastModified: newestAvatarUpdate } : {}),
    },
    ...indexableAvatars.map((avatar) => ({
      url: toAbsoluteUrl(`/${avatar.handle}`),
      lastModified: avatar.updatedAt,
    })),
  ];
}
