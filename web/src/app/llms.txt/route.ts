import { COMPARISONS } from '@/content/comparisons';
import { GUIDES } from '@/content/guides';
import { HOME_INTRODUCTION } from '@/content/home';
import { HOW_IT_WORKS_PAGE } from '@/content/how-it-works';
import { PERSONA_PAGES } from '@/content/personas';
import {
  PRODUCT_NAME,
  PRODUCT_PRICING_NOTE,
  PRODUCT_TAGLINE,
  SITE_URL,
} from '@/lib/product';
import { toAbsoluteUrl } from '@/lib/seo/structured-data';

/**
 * A plain-text summary for AI assistants (llmstxt.org). Built from the same
 * content modules the pages render, so it cannot describe a product the pages
 * do not. Avatars are not listed: they are people's own pages, and the sitemap
 * already offers the ones that may be indexed.
 */
// Built from source files only, so it can be rendered once at build time.
export const dynamic = 'force-static';

export function GET(): Response {
  const contentPages = [
    HOW_IT_WORKS_PAGE,
    ...Object.values(PERSONA_PAGES),
    ...Object.values(GUIDES),
    ...Object.values(COMPARISONS),
  ];

  const lines = [
    `# ${PRODUCT_NAME}`,
    '',
    `> ${PRODUCT_TAGLINE} ${PRODUCT_PRICING_NOTE}`,
    '',
    ...HOME_INTRODUCTION.paragraphs.flatMap((paragraph) => [paragraph, '']),
    'Facts:',
    '- An avatar answers from a public bio and three notes its owner writes (about them, how they talk, topics to avoid). It does not learn from uploaded documents, and it does not clone anyone’s voice or make video.',
    '- An avatar’s name and photo come from the Google account that launched it; it can only be of that person or of something they run.',
    '- Visitors talk by typing, without an account, and replies can be read out loud. Speaking to an avatar is coming soon. Visitors who sign in and accept the terms are remembered between conversations.',
    '- The owner reads every conversation with their avatar and can get a weekly email about who talked to it and who asked for them personally.',
    '- Every avatar says it is an AI whenever it is asked.',
    '',
    '## Pages',
    '',
    `- [Avatars](${SITE_URL}): every avatar people have launched`,
    ...contentPages.map(
      (page) =>
        `- [${page.metaTitle}](${toAbsoluteUrl(page.path)}): ${page.metaDescription}`,
    ),
    `- [Launch your avatar](${toAbsoluteUrl('/launch')})`,
    '',
    '## Optional',
    '',
    `- [Privacy notice](${toAbsoluteUrl('/privacy')})`,
    `- [Terms](${toAbsoluteUrl('/terms')})`,
    `- [Sitemap](${toAbsoluteUrl('/sitemap.xml')})`,
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
