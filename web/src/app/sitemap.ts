import type { MetadataRoute } from 'next';
import {
  listContentSitemapEntries,
  listDirectorySitemapEntries,
} from '@/lib/seo/sitemap-entries';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [...(await listDirectorySitemapEntries()), ...listContentSitemapEntries()];
}
