import type { NextConfig } from 'next';

/**
 * Headers that cost nothing and break nothing. There is deliberately no
 * Content-Security-Policy yet: the api is another origin, the live voice
 * session opens its own socket and the microphone runs in worklets, and a
 * policy that missed any of them would silently break voice.
 */
const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Only this site may ask for the microphone; nothing here uses the camera or location.
  { key: 'Permissions-Policy', value: 'microphone=(self), camera=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  // `@measagent/shared` ships TypeScript source rather than a build artifact —
  // there is no publish step between the two workspaces, so Next compiles it.
  transpilePackages: ['@measagent/shared'],
  typedRoutes: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
