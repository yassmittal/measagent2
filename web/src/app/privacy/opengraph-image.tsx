import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  renderSiteOgImage,
} from '@/lib/seo/og-image';

// A page that sets its own `openGraph` metadata no longer inherits the root
// image, so every public page without a more specific one gets its own here.
const TITLE = 'What meAsAgent stores, who sees it, and how to delete it';

export const alt = TITLE;
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default function PrivacyOgImage() {
  return renderSiteOgImage({ eyebrow: 'Privacy notice', title: TITLE });
}
