import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // `@measagent/shared` ships TypeScript source, as it does for web/.
  transpilePackages: ['@measagent/shared'],
  typedRoutes: true,
};

export default nextConfig;
