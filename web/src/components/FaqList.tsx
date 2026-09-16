import type { FaqEntry } from '@/content/content-types';

/** Answers shown in full, not collapsed: the same text is the page's `FAQPage` markup. */
export function FaqList({ entries }: { entries: FaqEntry[] }) {
  return (
    <section className="faq-list" aria-labelledby="faq-list-heading">
      <h2 id="faq-list-heading" className="faq-list-heading">
        Questions
      </h2>
      {entries.map((entry) => (
        <div key={entry.question} className="faq-item">
          <h3 className="faq-question">{entry.question}</h3>
          <p className="faq-answer">{entry.answer}</p>
        </div>
      ))}
    </section>
  );
}
