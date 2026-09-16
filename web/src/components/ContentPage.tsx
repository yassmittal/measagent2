import type { Route } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { ContentPageCopy, ContentSection } from '@/content/content-types';
import { formatAbsoluteDate } from '@/lib/format-date';
import {
  PRODUCT_BUILDER_NAME,
  PRODUCT_BUILDER_WEBSITE_URL,
  PRODUCT_NAME,
} from '@/lib/product';
import type { BreadcrumbItem } from '@/lib/seo/structured-data';
import { FaqList } from './FaqList';
import { SiteFooter } from './SiteFooter';

interface ContentPageProps {
  copy: ContentPageCopy;
  breadcrumbs: BreadcrumbItem[];
  /** Guides and comparisons carry a byline; product pages do not. */
  hasByline?: boolean;
  /** Rendered between the lede and the sections — a comparison's table. */
  children?: ReactNode;
}

/**
 * The long-form page layout: breadcrumbs, a heading that answers the query,
 * sections, an FAQ, related links and a way to launch. Every word comes from
 * the copy object, so the page and its structured data agree.
 */
export function ContentPage({
  copy,
  breadcrumbs,
  hasByline = false,
  children,
}: ContentPageProps) {
  return (
    <div className="content-page">
      <main className="content-page-inner">
        <nav className="content-breadcrumbs" aria-label="Breadcrumb">
          <ol className="content-breadcrumbs-list">
            {breadcrumbs.map((item, index) => (
              <li key={item.path} className="content-breadcrumbs-item">
                {index === breadcrumbs.length - 1 ? (
                  <span aria-current="page">{item.name}</span>
                ) : (
                  <Link href={item.path as Route} className="content-breadcrumbs-link">
                    {item.name}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <article className="content-article">
          <header className="content-header">
            <p className="content-eyebrow">{copy.eyebrow}</p>
            <h1 className="content-title">{copy.heading}</h1>
            <p className="content-lede">{copy.lede}</p>
            <p className="content-meta">
              {hasByline ? (
                <>
                  By{' '}
                  <a
                    href={PRODUCT_BUILDER_WEBSITE_URL}
                    className="content-byline-link"
                    rel="author"
                  >
                    {PRODUCT_BUILDER_NAME}
                  </a>
                  , who builds {PRODUCT_NAME} ·{' '}
                </>
              ) : null}
              Updated{' '}
              <time dateTime={copy.updatedAt}>{formatAbsoluteDate(copy.updatedAt)}</time>
            </p>
          </header>

          {children}

          {copy.sections.map((section) => (
            <ContentSectionBlock key={section.heading} section={section} />
          ))}

          {copy.faq.length > 0 ? <FaqList entries={copy.faq} /> : null}
        </article>

        <aside className="content-cta">
          <p className="content-cta-text">
            Launch an AI avatar of yourself, or of something you run.
          </p>
          <Link href="/launch" className="content-cta-button">
            Launch your avatar
          </Link>
        </aside>

        <nav className="content-related" aria-labelledby="content-related-heading">
          <h2 id="content-related-heading" className="content-related-heading">
            Related
          </h2>
          <ul className="content-related-list">
            {copy.related.map((link) => (
              <li key={link.href}>
                <Link href={link.href as Route} className="content-related-link">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </main>
      <SiteFooter />
    </div>
  );
}

function ContentSectionBlock({ section }: { section: ContentSection }) {
  return (
    <section className="content-section">
      <h2 className="content-section-heading">{section.heading}</h2>
      {section.paragraphs.map((paragraph) => (
        <p key={paragraph} className="content-paragraph">
          {paragraph}
        </p>
      ))}
      {section.bulletPoints !== undefined ? (
        <ul className="content-list">
          {section.bulletPoints.map((point) => (
            <li key={point} className="content-list-item">
              {point}
            </li>
          ))}
        </ul>
      ) : null}
      {section.steps !== undefined ? (
        <ol className="content-steps">
          {section.steps.map((step) => (
            <li key={step} className="content-steps-item">
              {step}
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
