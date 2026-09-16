/**
 * An avatar lives at `/<handle>`, at the root of the web app, so a handle must
 * never be a word a page already uses — or one a page is likely to want later,
 * because a static route added over an existing handle silently takes its URL.
 * Names Next.js reserves itself (`_next`) are already excluded by the pattern.
 * Before adding a top-level route, add its segment here and check that no
 * avatar already holds it (CLAUDE.md § SEO says how).
 */
const RESERVED_AVATAR_HANDLES: ReadonlySet<string> = new Set([
  'about',
  'account',
  'admin',
  'api',
  'apple-icon',
  'avatar',
  'avatars',
  'blog',
  'compare',
  'contact',
  'directory',
  'docs',
  'edit',
  'explore',
  'faq',
  'favicon',
  'for',
  'guides',
  'health',
  'help',
  'how-it-works',
  'icon',
  'launch',
  'llms',
  'login',
  'logout',
  'manifest',
  'measagent',
  'new',
  'opengraph-image',
  'pricing',
  'privacy',
  'robots',
  'settings',
  'sign-in',
  'sign-out',
  'signin',
  'signout',
  'sitemap',
  'support',
  'terms',
  'twitter-image',
  'worklets',
  'www',
]);

export function isReservedAvatarHandle(handle: string): boolean {
  return RESERVED_AVATAR_HANDLES.has(handle);
}
