import type { AvatarProfile } from '@measagent/shared/avatars';
import type { ArticleCopy, FaqEntry, SitePath } from '@/content/content-types';
import {
  PRODUCT_BUILDER_NAME,
  PRODUCT_BUILDER_PROFILE_URLS,
  PRODUCT_BUILDER_WEBSITE_URL,
  PRODUCT_NAME,
  PRODUCT_PRICING_NOTE,
  PRODUCT_TAGLINE,
  SITE_URL,
} from '@/lib/product';

/**
 * schema.org JSON-LD, built from the same data the page renders, so markup can
 * never claim what the page does not show. No ratings, reviews or user counts:
 * the site has none, and markup is not the place to invent them.
 *
 * Nodes refer to each other by `@id`; `StructuredData` puts every node a page
 * needs into one `@graph`.
 */
export interface StructuredDataNode {
  '@type': string;
  '@id'?: string;
  [property: string]: unknown;
}

export interface BreadcrumbItem {
  name: string;
  path: SitePath;
}

export function toAbsoluteUrl(path: string): string {
  return path === '/' ? SITE_URL : `${SITE_URL}${path}`;
}

const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const BUILDER_ID = `${SITE_URL}/#builder`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const LOGO_URL = `${SITE_URL}/brand/logo-512.png`;

export function buildOrganizationNode(): StructuredDataNode {
  return {
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: PRODUCT_NAME,
    url: SITE_URL,
    logo: { '@type': 'ImageObject', url: LOGO_URL, width: 512, height: 512 },
    founder: buildBuilderNode(),
  };
}

/**
 * The person who builds the site — the founder and the byline on articles. Not
 * an avatar: this is the operator, like the contact address on the legal pages.
 */
function buildBuilderNode(): StructuredDataNode {
  return {
    '@type': 'Person',
    '@id': BUILDER_ID,
    name: PRODUCT_BUILDER_NAME,
    url: PRODUCT_BUILDER_WEBSITE_URL,
    sameAs: [...PRODUCT_BUILDER_PROFILE_URLS],
  };
}

/** No `SearchAction`: the site has no search to point one at. */
export function buildWebSiteNode(): StructuredDataNode {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: PRODUCT_NAME,
    url: SITE_URL,
    description: PRODUCT_TAGLINE,
    inLanguage: 'en',
    publisher: { '@id': ORGANIZATION_ID },
  };
}

/** The product itself. The offer is true today and says so in its own words. */
export function buildWebApplicationNode(): StructuredDataNode {
  return {
    '@type': 'WebApplication',
    '@id': `${SITE_URL}/#application`,
    name: PRODUCT_NAME,
    url: SITE_URL,
    description: PRODUCT_TAGLINE,
    applicationCategory: 'CommunicationApplication',
    operatingSystem: 'Any (web browser)',
    isAccessibleForFree: true,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: PRODUCT_PRICING_NOTE,
    },
    publisher: { '@id': ORGANIZATION_ID },
  };
}

/**
 * An avatar's page describes the person — or, for an avatar of something its
 * owner runs, the organization — behind it. `sameAs` only ever holds the link
 * the owner supplied; nothing is looked up or guessed.
 */
export function buildAvatarProfilePageNode(avatar: AvatarProfile): StructuredDataNode {
  const pageUrl = toAbsoluteUrl(`/${avatar.handle}`);

  return {
    '@type': 'ProfilePage',
    '@id': `${pageUrl}#page`,
    url: pageUrl,
    name: `${avatar.name}'s AI avatar`,
    dateModified: avatar.updatedAt,
    isPartOf: { '@id': WEBSITE_ID },
    mainEntity: {
      '@type': avatar.subject === 'project' ? 'Organization' : 'Person',
      '@id': `${pageUrl}#subject`,
      name: avatar.name,
      description: avatar.bio,
      url: pageUrl,
      ...(avatar.pictureUrl !== null ? { image: avatar.pictureUrl } : {}),
      ...(avatar.websiteUrl !== null ? { sameAs: [avatar.websiteUrl] } : {}),
    },
  };
}

export function buildBreadcrumbListNode(items: BreadcrumbItem[]): StructuredDataNode {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: toAbsoluteUrl(item.path),
    })),
  };
}

export function buildFaqPageNode(path: string, faq: FaqEntry[]): StructuredDataNode {
  return {
    '@type': 'FAQPage',
    '@id': `${toAbsoluteUrl(path)}#faq`,
    mainEntity: faq.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: { '@type': 'Answer', text: entry.answer },
    })),
  };
}

export function buildArticleNode(article: ArticleCopy): StructuredDataNode {
  const pageUrl = toAbsoluteUrl(article.path);

  return {
    '@type': 'Article',
    '@id': `${pageUrl}#article`,
    headline: article.heading,
    description: article.metaDescription,
    url: pageUrl,
    mainEntityOfPage: pageUrl,
    image: `${pageUrl}/opengraph-image`,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    inLanguage: 'en',
    author: buildBuilderNode(),
    publisher: { '@id': ORGANIZATION_ID },
  };
}

/**
 * Serialised for a `<script>` tag. `<` is escaped so text an owner wrote — a bio
 * containing `</script>` — cannot end the tag early, as the Next.js JSON-LD guide
 * warns.
 */
export function serializeStructuredData(nodes: StructuredDataNode[]): string {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes }).replace(
    /</g,
    '\\u003c',
  );
}
