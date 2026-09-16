import { notFound } from 'next/navigation';
import { COMPARISONS, isComparisonSlug } from '@/content/comparisons';
import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  renderSiteOgImage,
} from '@/lib/seo/og-image';

export const alt = 'A page from meAsAgent: its title on a plain background';
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default async function ComparisonOgImage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  if (!isComparisonSlug(slug)) notFound();

  const copy = COMPARISONS[slug];
  return renderSiteOgImage({ eyebrow: copy.eyebrow, title: copy.heading });
}
