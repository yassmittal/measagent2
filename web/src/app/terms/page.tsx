import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';
import { CONTACT_EMAIL, PRODUCT_NAME } from '@/lib/product';

const UPDATED_AT = '2026-09-15';

export const metadata: Metadata = {
  title: 'Terms',
  description: `The terms for using ${PRODUCT_NAME}.`,
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms" updatedAt={UPDATED_AT}>
      <h2>What this is</h2>
      <p>
        {PRODUCT_NAME} hosts AI avatars of real people. Each avatar answers as the person
        who launched it, but it is not that person, and it is not supervised by anyone
        while you use it. It will get things wrong, and it can state something false with
        complete confidence.
      </p>
      <p>
        Nothing an avatar says is professional advice — not legal, medical, financial or
        employment advice — and nothing it says is a commitment by the person it
        represents or by anyone they work with.
      </p>

      <h2>Using it</h2>
      <ul>
        <li>Do not use it to break the law or to harm anyone.</li>
        <li>
          Do not send anything you would not want stored — secrets, credentials, or other
          people&apos;s personal information.
        </li>
        <li>
          Do not try to reach the service through anything but this site, and do not
          hammer it. It is one small server.
        </li>
      </ul>

      <h2>Launching an avatar</h2>
      <ul>
        <li>
          An avatar can only be of you. Its name and photo come from the Google account
          you launch it with, and you confirm it is of you when you launch it.
        </li>
        <li>
          You are responsible for what you write about yourself, and for not using it to
          mislead the people who talk to your avatar.
        </li>
        <li>
          You can read what visitors say to your avatar, so that you hear from the people
          you could not talk to yourself. Use it for that and nothing else: do not publish
          it, sell it, or use it to track down or contact anyone beyond what they chose to
          tell your avatar.
        </li>
        <li>
          Your avatar will always say it is an AI when asked. Nothing you write changes
          that.
        </li>
        <li>
          An avatar appears in the directory only once it has been reviewed, and it can be
          declined, unlisted or taken down.
        </li>
      </ul>

      <h2>Your messages</h2>
      <p>
        What you write stays yours. By sending it you allow it to be stored and processed
        to answer you, as described in the <a href="/privacy">privacy notice</a>. An
        avatar&apos;s name and likeness belong to the person it represents.
      </p>

      <h2>Availability</h2>
      <p>
        This is a small project. It may be slow, it may be down, and it may change or stop
        entirely without notice.
      </p>

      <h2>Questions</h2>
      <p>
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </LegalPage>
  );
}
