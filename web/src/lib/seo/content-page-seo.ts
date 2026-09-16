import type { Metadata } from 'next';
import type { ArticleCopy, ContentPageCopy } from '@/content/content-types';
import { buildPageMetadata } from './page-metadata';
import {
  type BreadcrumbItem,
  buildArticleNode,
  buildBreadcrumbListNode,
  buildFaqPageNode,
  type StructuredDataNode,
} from './structured-data';

export function buildContentPageMetadata(
  copy: ContentPageCopy,
  isArticle = false,
): Metadata {
  return buildPageMetadata({
    path: copy.path,
    title: copy.metaTitle,
    description: copy.metaDescription,
    openGraphType: isArticle ? 'article' : 'website',
  });
}

/** Content pages sit one level under the front page; there are no hub pages to pass through. */
export function buildContentBreadcrumbs(copy: ContentPageCopy): BreadcrumbItem[] {
  return [
    { name: 'Home', path: '/' },
    { name: copy.metaTitle, path: copy.path },
  ];
}

export function buildContentPageNodes(
  copy: ContentPageCopy,
  breadcrumbs: BreadcrumbItem[],
  article?: ArticleCopy,
): StructuredDataNode[] {
  return [
    buildBreadcrumbListNode(breadcrumbs),
    ...(copy.faq.length > 0 ? [buildFaqPageNode(copy.path, copy.faq)] : []),
    ...(article !== undefined ? [buildArticleNode(article)] : []),
  ];
}
