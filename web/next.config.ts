import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // `@measagent/shared` ships TypeScript source rather than a build artifact —
  // there is no publish step between the two workspaces, so Next compiles it.
  transpilePackages: ['@measagent/shared'],
  typedRoutes: true,
};

export default nextConfig;
