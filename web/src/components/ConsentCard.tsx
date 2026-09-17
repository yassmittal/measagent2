'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSession } from '@/state/SessionProvider';
import { BusyButtonLabel } from './BusyButtonLabel';

export function ConsentCard() {
  const { isConsentRequired, acceptCurrentTerms } = useSession();
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isConsentRequired) return null;

  const accept = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await acceptCurrentTerms();
    } catch {
      setError('That did not save. Try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="consent-scrim">
      <div
        className="consent-card"
        role="dialog"
        aria-modal="true"
        aria-label="Before you start"
      >
        <h2 className="consent-title">Before you start</h2>
        <p className="consent-lede">
          Every avatar here is <strong>an AI speaking as a real person</strong>, not the
          person. Three things to know:
        </p>

        <ol className="consent-list">
          <li>
            <span className="consent-num">1</span>
            <span>
              What you type and say is saved to your account, and each avatar remembers
              what you tell it between chats. The person behind an avatar can read your
              chats with it. Nobody else can.
            </span>
          </li>
          <li>
            <span className="consent-num">2</span>
            <span>
              Replies, and what an avatar remembers about you, are written by an AI model
              from another company. When you speak, a speech service turns it into text
              and reads the reply out loud.
            </span>
          </li>
          <li>
            <span className="consent-num">3</span>
            <span>
              We never sell any of it or use it for ads, and you can ask us to delete all
              of it.
            </span>
          </li>
        </ol>

        <button
          type="button"
          className="consent-accept"
          onClick={accept}
          disabled={isSubmitting}
        >
          <BusyButtonLabel isBusy={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'I understand'}
          </BusyButtonLabel>
        </button>

        {error !== null ? <p className="consent-error">{error}</p> : null}

        <p className="consent-fineprint">
          The long version is in the <Link href="/privacy">privacy notice</Link> and the{' '}
          <Link href="/terms">terms</Link>.
        </p>
      </div>
    </div>
  );
}
