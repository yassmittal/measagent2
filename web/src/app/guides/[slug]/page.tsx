import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ContentPage } from '@/components/ContentPage';
import { StructuredData } from '@/components/StructuredData';
import { GUIDE_SLUGS, GUIDES, isGuideSlug } from '@/content/guides';
import {
  buildContentBreadcrumbs,
  buildContentPageMetadata,
  buildContentPageNodes,
} from '@/lib/seo/content-page-seo';

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata(
  props: PageProps<'/guides/[slug]'>,
): Promise<Metadata> {
  const { slug } = await props.params;
  return isGuideSlug(slug) ? buildContentPageMetadata(GUIDES[slug], true) : {};
}

export default async function GuidePage(props: PageProps<'/guides/[slug]'>) {
  const { slug } = await props.params;
  if (!isGuideSlug(slug)) notFound();

  const guide = GUIDES[slug];
  const breadcrumbs = buildContentBreadcrumbs(guide);

  return (
    <>
      <ContentPage copy={guide} breadcrumbs={breadcrumbs} hasByline />
      <StructuredData nodes={buildContentPageNodes(guide, breadcrumbs, guide)} />
    </>
  );
}
