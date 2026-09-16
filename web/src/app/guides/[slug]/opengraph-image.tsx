import { notFound } from 'next/navigation';
import { GUIDES, isGuideSlug } from '@/content/guides';
import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  renderSiteOgImage,
} from '@/lib/seo/og-image';

export const alt = 'A page from meAsAgent: its title on a plain background';
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default async function GuideOgImage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  if (!isGuideSlug(slug)) notFound();

  const copy = GUIDES[slug];
  return renderSiteOgImage({ eyebrow: copy.eyebrow, title: copy.heading });
}
