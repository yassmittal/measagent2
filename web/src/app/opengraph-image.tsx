import { PRODUCT_NAME, PRODUCT_TAGLINE } from '@/lib/product';
import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  renderSiteOgImage,
} from '@/lib/seo/og-image';

export const alt = `${PRODUCT_NAME}: ${PRODUCT_TAGLINE}`;
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default function SiteOgImage() {
  return renderSiteOgImage({ eyebrow: PRODUCT_NAME, title: PRODUCT_TAGLINE });
}
