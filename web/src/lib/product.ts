export const PRODUCT_NAME = 'meAsAgent';

/**
 * Lowercase on purpose: hostnames are case-insensitive, but a canonical URL is
 * compared as a string, so every URL the site emits has to agree on one form.
 * The day the site moves to its own domain, this is the line that changes.
 */
export const SITE_URL = 'https://measagent.vercel.app';

export const PRODUCT_TAGLINE =
  'Talk to AI avatars of real people and the things they build — or launch your own.';

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
 * Public profiles of the product and its builder, used as `sameAs` so search
 * engines can tell this meAsAgent apart from other things with a similar name.
 * Empty until real URLs are supplied; an invented one would be worse than none.
 */
export const PRODUCT_PROFILE_URLS: readonly string[] = [];
