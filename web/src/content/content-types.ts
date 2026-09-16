import type { Route } from 'next';

/**
 * The shapes the content pages are written in. Copy lives as data so each page
 * component stays presentational, and so `llms.txt`, the sitemap and the
 * structured data read the same words and dates the page shows.
 */

export interface ContentSection {
  heading: string;
  paragraphs: string[];
  /** Rendered after the paragraphs. */
  bulletPoints?: string[];
  /** Rendered as an ordered list after the paragraphs. */
  steps?: string[];
}

export interface FaqEntry {
  question: string;
  /** Plain text: it is shown on the page and repeated in `FAQPage` markup. */
  answer: string;
}

/**
 * A page this site serves. `Route` alone only admits static routes as values
 * held in data, so the content routes' patterns are spelled out; `<Link>` call
 * sites cast back to `Route`, which is what the typed-routes docs recommend.
 */
export type SitePath =
  | Route
  | `/for/${string}`
  | `/guides/${string}`
  | `/compare/${string}`
  /** An avatar's page, at its handle. */
  | `/${string}`;

export interface RelatedLink {
  href: SitePath;
  label: string;
}

/** Everything a long-form page needs, whatever its kind. */
export interface ContentPageCopy {
  path: SitePath;
  /** The `<title>` without the brand, and the breadcrumb's label. At most 60 characters with the brand. */
  metaTitle: string;
  /** At most 155 characters. */
  metaDescription: string;
  /** Short label above the heading. */
  eyebrow: string;
  heading: string;
  /** Answers the page's query in its first sentences. */
  lede: string;
  sections: ContentSection[];
  faq: FaqEntry[];
  related: RelatedLink[];
  /** ISO date the copy last changed in substance. */
  updatedAt: string;
}

/** A page written by a person, shown with a byline and dates. */
export interface ArticleCopy extends ContentPageCopy {
  publishedAt: string;
}
