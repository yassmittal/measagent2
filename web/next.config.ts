import type { NextConfig } from 'next';

type Directives = Record<string, string[]>;

/**
 * Merges directive lists into one policy string. `'none'` is only valid on its
 * own, so a part that adds a real source replaces it.
 */
function buildCsp(parts: Directives[]): string {
  const merged: Directives = {};
  for (const part of parts) {
    for (const [name, values] of Object.entries(part)) {
      merged[name] = [...(merged[name] ?? []), ...values];
    }
  }
  return Object.entries(merged)
    .map(([name, values]) => {
      const unique = [...new Set(values)];
      const sources = unique.length > 1 ? unique.filter((v) => v !== "'none'") : unique;
      return [name, ...sources].join(' ');
    })
    .join('; ');
}

/** Origin of a configured URL, or null when unset or malformed, so nothing is added. */
function originOf(value: string | undefined): string | null {
  if (!value || value.trim() === '') return null;
  try {
    return new URL(value.trim()).origin;
  } catch {
    return null;
  }
}

// Same default as src/lib/api-client.ts, so local development works with nothing set.
const apiOrigin = originOf(process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3010');
// Live voice is off (src/lib/voice/availability.ts). When it comes back, setting this
// variable is what lets its realtime socket through; unset, nothing is added.
const voiceOrigin = originOf(process.env.NEXT_PUBLIC_SPEECH_TO_SPEECH_URL);

/**
 * Content-Security-Policy, static-compatible and shipped REPORT-ONLY first.
 *
 * This used to be deferred because a policy that missed the live voice socket or
 * its worklets would silently break voice. Live voice is switched off now, and
 * everything the page does is accounted for:
 * - the api is another origin, reached by streamed `fetch` (connect-src);
 * - spoken replies arrive as `audio_delta` spans that `useSpeechPlayback` turns
 *   into `blob:` URLs for `new Audio()` (media-src blob:);
 * - the voice worklets are same-origin files (script-src 'self'), and the voice
 *   socket's origin is added from its env var when voice returns;
 * - Sign in with Google loads its client, button iframe and styles from
 *   accounts.google.com/gsi/, and portraits come from Google's photo hosts.
 * No nonce: Next can only nonce a page it renders per request, which would make
 * every static page here dynamic, so its inline RSC scripts need 'unsafe-inline'.
 * Report-Only because a real spoken reply and a real sign-in can only be checked
 * on the deployed site; switch the header name to "Content-Security-Policy" once
 * the live checks in docs/seo/SEO.md show no violations.
 * See seo-2026/research/E-security-headers.md.
 */
const BASE_CSP: Directives = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", 'https://accounts.google.com/gsi/client'],
  'style-src': ["'self'", "'unsafe-inline'", 'https://accounts.google.com/gsi/style'],
  'img-src': ["'self'", 'data:', 'blob:', 'https://*.googleusercontent.com'],
  'font-src': ["'self'"],
  'connect-src': [
    "'self'",
    'https://accounts.google.com/gsi/',
    ...(apiOrigin ? [apiOrigin] : []),
    ...(voiceOrigin ? [voiceOrigin] : []),
  ],
  'media-src': ["'self'", 'blob:'],
  'frame-src': ['https://accounts.google.com/gsi/'],
  'worker-src': ["'self'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
};

// React's dev tooling needs eval; Vercel Analytics' dev build loads from its CDN.
const DEV_CSP: Directives = {
  'script-src': ["'unsafe-eval'", 'https://va.vercel-scripts.com'],
};

// The Vercel Toolbar is injected on preview deployments only.
const VERCEL_PREVIEW_CSP: Directives = {
  'script-src': ['https://vercel.live'],
  'connect-src': ['https://vercel.live', 'wss://ws-us3.pusher.com'],
  'img-src': ['https://vercel.live', 'https://vercel.com'],
  'frame-src': ['https://vercel.live'],
  'style-src': ['https://vercel.live'],
  'font-src': ['https://vercel.live', 'https://assets.vercel.com'],
};

const contentSecurityPolicy = buildCsp([
  BASE_CSP,
  process.env.NODE_ENV === 'development' ? DEV_CSP : {},
  process.env.VERCEL_ENV === 'preview' ? VERCEL_PREVIEW_CSP : {},
]);

const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Only this site may ask for the microphone; nothing here uses the camera, location,
  // payments or USB.
  {
    key: 'Permissions-Policy',
    value: 'microphone=(self), camera=(), geolocation=(), payment=(), usb=()',
  },
  // Nothing frames this site. `frame-ancestors` in the CSP says the same.
  { key: 'X-Frame-Options', value: 'DENY' },
  // Sign in with Google's button opens a popup that has to report back to this window.
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
  { key: 'Content-Security-Policy-Report-Only', value: contentSecurityPolicy },
];

// An owner's private pages already carry a noindex meta tag; the header covers any
// non-HTML response under them too.
const PRIVATE_NOINDEX = [{ key: 'X-Robots-Tag', value: 'noindex' }];

const nextConfig: NextConfig = {
  // `@measagent/shared` ships TypeScript source rather than a build artifact —
  // there is no publish step between the two workspaces, so Next compiles it.
  transpilePackages: ['@measagent/shared'],
  typedRoutes: true,
  poweredByHeader: false,
  async headers() {
    return [
      { source: '/:path*', headers: SECURITY_HEADERS },
      { source: '/launch/visitors/:path*', headers: PRIVATE_NOINDEX },
      { source: '/launch/unsubscribe/:path*', headers: PRIVATE_NOINDEX },
    ];
  },
};

export default nextConfig;
