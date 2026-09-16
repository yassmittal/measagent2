import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ComparisonTable } from '@/components/ComparisonTable';
import { ContentPage } from '@/components/ContentPage';
import { StructuredData } from '@/components/StructuredData';
import { COMPARISON_SLUGS, COMPARISONS, isComparisonSlug } from '@/content/comparisons';
import {
  buildContentBreadcrumbs,
  buildContentPageMetadata,
  buildContentPageNodes,
} from '@/lib/seo/content-page-seo';

export const dynamicParams = false;

export function generateStaticParams() {
  return COMPARISON_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata(
  props: PageProps<'/compare/[slug]'>,
): Promise<Metadata> {
  const { slug } = await props.params;
  return isComparisonSlug(slug) ? buildContentPageMetadata(COMPARISONS[slug], true) : {};
}

export default async function ComparisonPage(props: PageProps<'/compare/[slug]'>) {
  const { slug } = await props.params;
  if (!isComparisonSlug(slug)) notFound();

  const comparison = COMPARISONS[slug];
  const breadcrumbs = buildContentBreadcrumbs(comparison);

  return (
    <>
      <ContentPage copy={comparison} breadcrumbs={breadcrumbs} hasByline>
        <ComparisonTable
          competitorName={comparison.competitorName}
          rows={comparison.rows}
        />
      </ContentPage>
      <StructuredData
        nodes={buildContentPageNodes(comparison, breadcrumbs, comparison)}
      />
    </>
  );
}
