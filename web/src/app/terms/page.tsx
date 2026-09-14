import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';
import { CONTACT_EMAIL, PERSONA_NAME, PRODUCT_NAME } from '@/lib/persona';

const UPDATED_AT = '2026-09-12';

export const metadata: Metadata = {
  title: `Terms — ${PRODUCT_NAME}`,
  description: `The terms for using ${PRODUCT_NAME}.`,
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms" updatedAt={UPDATED_AT}>
      <h2>What this is</h2>
      <p>
        {PRODUCT_NAME} is an AI that answers as {PERSONA_NAME}. It is not {PERSONA_NAME},
        and it is not supervised by a person while you use it. It will get things wrong,
        and it can state something false with complete confidence.
      </p>
      <p>
        Nothing it says is professional advice — not legal, medical, financial or
        employment advice — and nothing it says is a commitment by {PERSONA_NAME} or by
        anyone {PERSONA_NAME} works with.
      </p>

      <h2>Using it</h2>
      <ul>
        <li>Do not use it to break the law or to harm anyone.</li>
        <li>
          Do not send anything you would not want stored — secrets, credentials, or other
          people's personal information.
        </li>
        <li>
          Do not try to reach the service through anything but this site, and do not
          hammer it. It is one small server.
        </li>
      </ul>

      <h2>Your messages</h2>
      <p>
        What you write stays yours. By sending it you allow it to be stored and processed
        to answer you, as described in the <a href="/privacy">privacy notice</a>. The
        persona, its name, likeness and the wording of its replies belong to{' '}
        {PERSONA_NAME}.
      </p>

      <h2>Availability</h2>
      <p>
        This is a personal project. It may be slow, it may be down, and it may change or
        stop entirely without notice.
      </p>

      <h2>Questions</h2>
      <p>
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </LegalPage>
  );
}
