import { COMPARISONS } from './comparisons';
import type { RelatedLink } from './content-types';
import { GUIDES } from './guides';
import { HOW_IT_WORKS_PAGE } from './how-it-works';
import { PERSONA_PAGES } from './personas';

export interface SiteLinkGroup {
  heading: string;
  links: RelatedLink[];
}

/**
 * The site's public pages, grouped. The footer and `llms.txt` both read this
 * list, so a new content page is linked from both by adding it to its content
 * module once.
 */
export const SITE_LINK_GROUPS: SiteLinkGroup[] = [
  {
    heading: 'Product',
    links: [
      { href: '/', label: 'Avatars' },
      { href: HOW_IT_WORKS_PAGE.path, label: 'How it works' },
      { href: '/launch', label: 'Launch your avatar' },
    ],
  },
  {
    heading: 'Who it’s for',
    links: Object.values(PERSONA_PAGES).map((page) => ({
      href: page.path,
      label: page.eyebrow,
    })),
  },
  {
    heading: 'Learn',
    links: [
      ...Object.values(GUIDES).map((guide) => ({
        href: guide.path,
        label: guide.metaTitle,
      })),
      ...Object.values(COMPARISONS).map((comparison) => ({
        href: comparison.path,
        label: `Compared with ${comparison.competitorName}`,
      })),
    ],
  },
  {
    heading: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
    ],
  },
];
