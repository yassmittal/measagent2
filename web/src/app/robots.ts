import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/product';

/**
 * An owner's private pages. They also carry `noindex`, but nothing public links
 * to them, so there is no reason to let crawlers spend time finding that out.
 */
const PRIVATE_PATHS = ['/launch/visitors', '/launch/unsubscribe'];

/**
 * AI crawlers are welcome: conversations are never public pages, so what they
 * can read is exactly what any visitor can. Under RFC 9309 a crawler obeys only
 * the most specific group that names it and ignores `*`, so this group repeats
 * the private paths rather than inheriting them. Tokens are the ones each vendor
 * documents as of 2026-09-28 (seo-2026/research/AC-engines-and-hype.md, A-13):
 * search and answer crawlers that cite pages, and the training crawlers of the
 * same vendors. `Google-Extended` governs Gemini app and Vertex AI only, not AI
 * Overviews or AI Mode, which follow Googlebot.
 */
const AI_CRAWLERS = [
  'OAI-SearchBot',
  'ChatGPT-User',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  'Meta-WebIndexer',
  'GPTBot',
  'ClaudeBot',
  'Google-Extended',
];

/**
 * Common Crawl is blocked for a privacy reason, not a traffic one. Every
 * `/<handle>` page is a profile of a real person, written by them, and Common
 * Crawl is a public archive redistributed to anyone, including dataset builders
 * the owner never agreed to. Owners agreed to a public page and to search
 * engines; that is what stays open. (The old comment said CCBot "sends nobody
 * back", which is equally true of GPTBot and ClaudeBot, both allowed.) Letting
 * CCBot read only the product pages is proposed to Yash, not done.
 */
const OPEN_ARCHIVE_CRAWLERS = ['CCBot'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: PRIVATE_PATHS },
      { userAgent: AI_CRAWLERS, allow: '/', disallow: PRIVATE_PATHS },
      { userAgent: OPEN_ARCHIVE_CRAWLERS, disallow: '/' },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
