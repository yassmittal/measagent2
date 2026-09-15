/**
 * An avatar lives at `/<handle>`, at the root of the web app, so a handle must
 * never be a word a page already uses — or one a page is likely to want later,
 * because a static route added over an existing handle silently takes its URL.
 * Names Next.js reserves itself (`_next`) are already excluded by the pattern.
 */
const RESERVED_AVATAR_HANDLES: ReadonlySet<string> = new Set([
  'about',
  'account',
  'admin',
  'api',
  'avatar',
  'avatars',
  'contact',
  'directory',
  'docs',
  'edit',
  'explore',
  'favicon',
  'health',
  'help',
  'icon',
  'launch',
  'login',
  'logout',
  'measagent',
  'new',
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
  'worklets',
  'www',
]);

export function isReservedAvatarHandle(handle: string): boolean {
  return RESERVED_AVATAR_HANDLES.has(handle);
}
