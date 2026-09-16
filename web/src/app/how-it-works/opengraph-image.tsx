import { HOW_IT_WORKS_PAGE } from '@/content/how-it-works';
import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  renderSiteOgImage,
} from '@/lib/seo/og-image';

export const alt = HOW_IT_WORKS_PAGE.heading;
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default function HowItWorksOgImage() {
  return renderSiteOgImage({
    eyebrow: HOW_IT_WORKS_PAGE.eyebrow,
    title: HOW_IT_WORKS_PAGE.heading,
  });
}
