import type { Metadata } from 'next';
import { ContentPage } from '@/components/ContentPage';
import { StructuredData } from '@/components/StructuredData';
import { HOW_IT_WORKS_PAGE } from '@/content/how-it-works';
import {
  buildContentBreadcrumbs,
  buildContentPageMetadata,
  buildContentPageNodes,
} from '@/lib/seo/content-page-seo';
import { buildWebApplicationNode } from '@/lib/seo/structured-data';

export const metadata: Metadata = buildContentPageMetadata(HOW_IT_WORKS_PAGE);

export default function HowItWorksPage() {
  const breadcrumbs = buildContentBreadcrumbs(HOW_IT_WORKS_PAGE);

  return (
    <>
      <ContentPage copy={HOW_IT_WORKS_PAGE} breadcrumbs={breadcrumbs} />
      <StructuredData
        nodes={[
          buildWebApplicationNode(),
          ...buildContentPageNodes(HOW_IT_WORKS_PAGE, breadcrumbs),
        ]}
      />
    </>
  );
}
