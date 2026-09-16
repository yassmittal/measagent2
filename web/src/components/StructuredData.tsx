import {
  type StructuredDataNode,
  serializeStructuredData,
} from '@/lib/seo/structured-data';

/** Renders on the server, so crawlers read the markup without running JavaScript. */
export function StructuredData({ nodes }: { nodes: StructuredDataNode[] }) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD has to be raw script text; `serializeStructuredData` escapes `<` so owner-written text cannot close the tag.
      dangerouslySetInnerHTML={{ __html: serializeStructuredData(nodes) }}
    />
  );
}
