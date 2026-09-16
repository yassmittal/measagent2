import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/product';

/**
 * An owner's private pages. They also carry `noindex`, but nothing public links
 * to them, so there is no reason to let crawlers spend time finding that out.
 */
const PRIVATE_PATHS = ['/launch/visitors', '/launch/unsubscribe'];

/**
 * AI assistants and answer engines are welcome: conversations are never public
 * pages, so what they can read is exactly what any visitor can. A crawler obeys
 * only the most specific group that names it, so each group repeats the
 * private paths rather than inheriting them from `*`.
 */
const AI_ANSWER_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'PerplexityBot',
  'Google-Extended',
];

/** Collects for model-training datasets and sends nobody to the site in return. */
const TRAINING_ONLY_CRAWLERS = ['CCBot'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: PRIVATE_PATHS },
      { userAgent: AI_ANSWER_CRAWLERS, allow: '/', disallow: PRIVATE_PATHS },
      { userAgent: TRAINING_ONLY_CRAWLERS, disallow: '/' },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
