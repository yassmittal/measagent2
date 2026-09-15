'use client';

import Link from 'next/link';
import { useState } from 'react';
import { unsubscribeFromWeeklySummary } from '@/lib/weekly-summary-client';

type UnsubscribeState = 'ready' | 'sending' | 'done' | 'failed';

/**
 * A button rather than an unsubscribe-on-arrival page: mail scanners open every
 * link in an email, and would otherwise turn the email off before it was read.
 */
export function WeeklySummaryUnsubscribe({ token }: { token: string | null }) {
  const [state, setState] = useState<UnsubscribeState>('ready');
  const [error, setError] = useState<string | null>(null);

  const unsubscribe = async () => {
    if (token === null) return;
    setState('sending');
    try {
      await unsubscribeFromWeeklySummary(token);
      setState('done');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'That did not go through.');
      setState('failed');
    }
  };

  return (
    <main className="weekly-summary-unsubscribe">
      <h1 className="owner-visitors-title">Weekly summary emails</h1>
      {token === null ? (
        <p className="owner-visitors-lede">
          This link is missing its token. Open it again from the email, or turn the email
          off on <Link href="/launch/visitors">your visitors page</Link>.
        </p>
      ) : state === 'done' ? (
        <p className="owner-visitors-lede">
          Done. You will not get the weekly summary any more. You can turn it back on from{' '}
          <Link href="/launch/visitors">your visitors page</Link>.
        </p>
      ) : (
        <>
          <p className="owner-visitors-lede">
            Stop the Monday email about who talked to your avatar? Your visitors page
            stays as it is.
          </p>
          <button
            type="button"
            className="weekly-summary-unsubscribe-button"
            onClick={unsubscribe}
            disabled={state === 'sending'}
          >
            {state === 'sending' ? 'Stopping…' : 'Stop these emails'}
          </button>
          {error !== null ? <p className="owner-visitors-error">{error}</p> : null}
        </>
      )}
    </main>
  );
}
