import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import type { ReactNode } from 'react';
import { PERSONA_NAME, PERSONA_TAGLINE, PRODUCT_NAME } from '@/lib/persona';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });

const SITE_URL = 'https://meAsAgent.vercel.app';
const TITLE = `${PRODUCT_NAME} — an AI that talks like ${PERSONA_NAME}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: PERSONA_TAGLINE,
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: PRODUCT_NAME,
    title: TITLE,
    description: PERSONA_TAGLINE,
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: PERSONA_TAGLINE },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#FBFBFB',
  colorScheme: 'light',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      {/* `#root` is the height chain the stylesheet hangs `100dvh` off: the
          thread scrolls inside it, so every layer above must have a height. */}
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
