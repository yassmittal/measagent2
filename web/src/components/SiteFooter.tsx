import type { Route } from 'next';
import Link from 'next/link';
import { SITE_LINK_GROUPS } from '@/content/site-links';
import { PRODUCT_NAME } from '@/lib/product';

/** Server rendered, so every public page is one crawlable link from the front page. */
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <nav className="site-footer-inner" aria-label="Site">
        {SITE_LINK_GROUPS.map((group) => (
          <div key={group.heading} className="site-footer-group">
            <h2 className="site-footer-heading">{group.heading}</h2>
            <ul className="site-footer-links">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href as Route} className="site-footer-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <p className="site-footer-note">
        {PRODUCT_NAME} · AI avatars say they are AI whenever they are asked.
      </p>
    </footer>
  );
}
