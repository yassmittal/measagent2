import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  renderSiteOgImage,
} from '@/lib/seo/og-image';

// A page that sets its own `openGraph` metadata no longer inherits the root
// image, so every public page without a more specific one gets its own here.
const TITLE = 'The terms for talking to and launching AI avatars';

export const alt = TITLE;
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default function TermsOgImage() {
  return renderSiteOgImage({ eyebrow: 'Terms', title: TITLE });
}
