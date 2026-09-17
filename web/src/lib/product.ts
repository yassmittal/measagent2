export const PRODUCT_NAME = 'meAsAgent';

/**
 * Lowercase on purpose: hostnames are case-insensitive, but a canonical URL is
 * compared as a string, so every URL the site emits has to agree on one form.
 * The day the site moves to its own domain, this is the line that changes.
 */
export const SITE_URL = 'https://measagent.vercel.app';

export const PRODUCT_TAGLINE = 'Make an AI you. It talks to people when you can’t.';

/** Joins a page's title to the brand, in the tab and in shared links alike. */
export const withProductName = (title: string): string => `${title} | ${PRODUCT_NAME}`;

/**
 * Launching costs nothing today and may not always. This sentence is the only
 * way the site says so, so a change of plan is one edit.
 */
export const PRODUCT_PRICING_NOTE = `Free while ${PRODUCT_NAME} is in early access.`;

/** Drawn wherever an avatar's owner has no Google photo. */
export const PLACEHOLDER_PORTRAIT_SRC = '/avatar/portrait.svg';

/** The operator's address, for the legal pages — not any avatar owner's. */
export const CONTACT_EMAIL = 'yashmittalmm@gmail.com';

/**
 * Who builds and writes for the site: the byline on guides and comparisons, and
 * the founder in its structured data. The operator, like `CONTACT_EMAIL` — never
 * an avatar.
 */
export const PRODUCT_BUILDER_NAME = 'Yash Mittal';

/**
 * The builder's own public profiles: the founder and author in structured data
 * point here, so search engines can tie the byline to one real person. The
 * product has no profiles of its own yet; when it does, they belong on the
 * Organization, not in this list.
 */
export const PRODUCT_BUILDER_WEBSITE_URL = 'https://www.yashmittal.xyz';

export const PRODUCT_BUILDER_PROFILE_URLS: readonly string[] = [
  PRODUCT_BUILDER_WEBSITE_URL,
  'https://github.com/yassmittal',
  'https://x.com/yash_mittal_dev',
  'https://www.linkedin.com/in/yashmittal01',
];
