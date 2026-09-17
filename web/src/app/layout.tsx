import { Analytics } from '@vercel/analytics/next';
import type { Metadata, Viewport } from 'next';
import { Geist, Newsreader } from 'next/font/google';
import type { ReactNode } from 'react';
import { StructuredData } from '@/components/StructuredData';
import {
  PRODUCT_BUILDER_NAME,
  PRODUCT_NAME,
  PRODUCT_TAGLINE,
  SITE_URL,
  withProductName,
} from '@/lib/product';
import { buildOrganizationNode, buildWebSiteNode } from '@/lib/seo/structured-data';
import { SessionProvider } from '@/state/SessionProvider';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });
// The display serif for titles and names. `opsz` lets the same file draw
// tighter, finer letterforms at headline sizes than at 20px.
const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
  axes: ['opsz'],
});

const DEFAULT_TITLE = `${PRODUCT_NAME} | AI avatars of real people`;

/**
 * The defaults every page inherits. Pages set their own title, description,
 * canonical and social tags through `buildPageMetadata`; what is here is only
 * what is true of the whole site.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: DEFAULT_TITLE, template: withProductName('%s') },
  description: PRODUCT_TAGLINE,
  applicationName: PRODUCT_NAME,
  authors: [{ name: PRODUCT_BUILDER_NAME }],
  creator: PRODUCT_BUILDER_NAME,
  publisher: PRODUCT_NAME,
  // A handle or a bio that looks like a phone number must stay plain text.
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: PRODUCT_NAME,
    title: DEFAULT_TITLE,
    description: PRODUCT_TAGLINE,
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: PRODUCT_TAGLINE,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#FAF6F0',
  colorScheme: 'light',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${newsreader.variable}`}>
      {/* `#root` is the height chain the stylesheet hangs `100dvh` off: the
          thread scrolls inside it, so every layer above must have a height. */}
      <body>
        <div id="root">
          {/* Above every page, so moving between the directory, an avatar and
              the launch page keeps one session rather than re-reading it. */}
          <SessionProvider>{children}</SessionProvider>
        </div>
        <StructuredData nodes={[buildOrganizationNode(), buildWebSiteNode()]} />
        <Analytics />
      </body>
    </html>
  );
}
