import { notFound } from 'next/navigation';
import { isPersonaSlug, PERSONA_PAGES } from '@/content/personas';
import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  renderSiteOgImage,
} from '@/lib/seo/og-image';

export const alt = 'A page from meAsAgent: its title on a plain background';
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default async function PersonaOgImage(props: {
  params: Promise<{ persona: string }>;
}) {
  const { persona } = await props.params;
  if (!isPersonaSlug(persona)) notFound();

  const copy = PERSONA_PAGES[persona];
  return renderSiteOgImage({ eyebrow: copy.eyebrow, title: copy.heading });
}
