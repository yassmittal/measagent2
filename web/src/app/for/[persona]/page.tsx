import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ContentPage } from '@/components/ContentPage';
import { StructuredData } from '@/components/StructuredData';
import { isPersonaSlug, PERSONA_PAGES, PERSONA_SLUGS } from '@/content/personas';
import {
  buildContentBreadcrumbs,
  buildContentPageMetadata,
  buildContentPageNodes,
} from '@/lib/seo/content-page-seo';

// Only the personas written in `content/personas.ts` exist; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return PERSONA_SLUGS.map((persona) => ({ persona }));
}

export async function generateMetadata(
  props: PageProps<'/for/[persona]'>,
): Promise<Metadata> {
  const { persona } = await props.params;
  return isPersonaSlug(persona) ? buildContentPageMetadata(PERSONA_PAGES[persona]) : {};
}

export default async function PersonaPage(props: PageProps<'/for/[persona]'>) {
  const { persona } = await props.params;
  if (!isPersonaSlug(persona)) notFound();

  const copy = PERSONA_PAGES[persona];
  const breadcrumbs = buildContentBreadcrumbs(copy);

  return (
    <>
      <ContentPage copy={copy} breadcrumbs={breadcrumbs} />
      <StructuredData nodes={buildContentPageNodes(copy, breadcrumbs)} />
    </>
  );
}
