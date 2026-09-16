import type { MetadataRoute } from 'next';
import { PRODUCT_NAME, PRODUCT_TAGLINE } from '@/lib/product';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: PRODUCT_NAME,
    short_name: PRODUCT_NAME,
    description: PRODUCT_TAGLINE,
    start_url: '/',
    display: 'standalone',
    background_color: '#faf6f0',
    theme_color: '#faf6f0',
    icons: [
      { src: '/brand/logo-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/brand/logo-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  };
}
