import type { Metadata } from 'next';
import { PRODUCT_NAME } from '@/lib/product';

interface PageMetadataInput {
  /** The page's path, starting with `/`. Becomes the canonical URL. */
  path: string;
  /** Without the brand — the root layout's title template appends it. */
  title: string;
  /** The title already carries the brand, so the template must not add it again. */
  isTitleAbsolute?: boolean;
  description: string;
  openGraphType?: 'website' | 'article' | 'profile';
  /** Leave false for pages that must stay out of search results. */
  isIndexable?: boolean;
}

/**
 * The metadata every public page needs, set the same way everywhere.
 *
 * Next.js replaces rather than merges a parent's `openGraph` and `twitter`
 * objects, so a page that sets only a title there silently loses the parent's
 * URL and type — the bug `/launch` had. Building all three together is what
 * keeps them from disagreeing. Images are not set here: each segment's
 * `opengraph-image.tsx` file supplies them.
 */
export function buildPageMetadata({
  path,
  title,
  isTitleAbsolute = false,
  description,
  openGraphType = 'website',
  isIndexable = true,
}: PageMetadataInput): Metadata {
  const socialTitle = isTitleAbsolute ? title : `${title} — ${PRODUCT_NAME}`;

  return {
    title: isTitleAbsolute ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: openGraphType,
      url: path,
      siteName: PRODUCT_NAME,
      title: socialTitle,
      description,
    },
    twitter: { card: 'summary_large_image', title: socialTitle, description },
    ...(isIndexable ? {} : { robots: { index: false, follow: true } }),
  };
}

/** Cuts text to a search snippet's length at a word boundary. */
export function truncateForDescription(text: string, maxLength = 155): string {
  const collapsedText = text.replace(/\s+/g, ' ').trim();
  if (collapsedText.length <= maxLength) return collapsedText;

  const cutText = collapsedText.slice(0, maxLength - 1);
  const lastSpaceIndex = cutText.lastIndexOf(' ');
  const wordBoundaryText =
    lastSpaceIndex > maxLength / 2 ? cutText.slice(0, lastSpaceIndex) : cutText;
  return `${wordBoundaryText.replace(/[\s,.;:—-]+$/, '')}…`;
}
