'use client';

import type { OwnerVisitorsResponse } from '@measagent/shared';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ApiRequestError } from '@/lib/api-client';
import { loadOwnVisitors } from '@/lib/visitor-client';
import { useSession } from '@/state/SessionProvider';
import { OwnerVisitorRow } from './OwnerVisitorRow';
import { OwnerVisitorsSkeleton } from './OwnerVisitorsSkeleton';
import { PageIntroSkeleton } from './PageIntroSkeleton';
import { SignInPrompt } from './SignInPrompt';
import { WeeklySummarySettings } from './WeeklySummarySettings';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

type VisitorsLoad =
  | { status: 'loading' }
  | { status: 'loaded'; response: OwnerVisitorsResponse }
  | { status: 'no-avatar' }
  | { status: 'failed'; message: string };

type VisitorsRange = 'week' | 'all';

/** The owner's list of everyone talking to their avatar. */
export function OwnerVisitors() {
  const { status: sessionStatus, user } = useSession();
  const [visitorsLoad, setVisitorsLoad] = useState<VisitorsLoad>({ status: 'loading' });
  const [range, setRange] = useState<VisitorsRange>('week');

  const signedInUserId = user?.id ?? null;
  const hasAcceptedTerms = user?.consentAcceptedAt != null;
  useEffect(() => {
    if (signedInUserId === null || !hasAcceptedTerms) return;

    let isMounted = true;
    setVisitorsLoad({ status: 'loading' });
    loadOwnVisitors()
      .then((response) => {
        if (isMounted) setVisitorsLoad({ status: 'loaded', response });
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        if (error instanceof ApiRequestError && error.status === 404) {
          setVisitorsLoad({ status: 'no-avatar' });
        } else {
          setVisitorsLoad({
            status: 'failed',
            message:
              error instanceof Error
                ? error.message
                : 'Your visitors could not be loaded.',
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [signedInUserId, hasAcceptedTerms]);

  const allVisitors =
    visitorsLoad.status === 'loaded' ? visitorsLoad.response.visitors : [];
  const weekStart = Date.now() - WEEK_MS;
  const shownVisitors =
    range === 'all'
      ? allVisitors
      : allVisitors.filter(
          (visitor) => new Date(visitor.lastSeenAt).getTime() >= weekStart,
        );

  return (
    <main className="owner-visitors">
      <Link href="/launch" className="owner-visitors-back">
        <ArrowLeft size={16} aria-hidden="true" />
        Your avatar
      </Link>

      {sessionStatus === 'loading' ? <PageIntroSkeleton /> : null}

      {sessionStatus === 'anonymous' ? (
        <SignInPrompt
          title="Your visitors"
          lede="Sign in with the Google account you launched your avatar with to see who talks to it."
          onSignedIn={() => {}}
        />
      ) : null}

      {user !== null ? (
        <>
          <h1 className="owner-visitors-title">Your visitors</h1>
          <p className="owner-visitors-lede">
            Everyone who has talked to your avatar, what they talked about, and what it
            remembers about them. They were told that you can read these chats.
          </p>
        </>
      ) : null}

      {sessionStatus !== 'anonymous' && visitorsLoad.status === 'loading' ? (
        <OwnerVisitorsSkeleton />
      ) : null}

      {visitorsLoad.status === 'no-avatar' ? (
        <p className="owner-visitors-empty">
          You have not launched an avatar yet. <Link href="/launch">Launch one</Link>
        </p>
      ) : null}

      {visitorsLoad.status === 'failed' ? (
        <p className="owner-visitors-error">{visitorsLoad.message}</p>
      ) : null}

      {visitorsLoad.status === 'loaded' ? (
        <>
          <WeeklySummarySettings />

          <div
            className="owner-visitors-range"
            role="tablist"
            aria-label="Which visitors"
          >
            <button
              type="button"
              role="tab"
              className="owner-visitors-range-option"
              aria-selected={range === 'week'}
              onClick={() => setRange('week')}
            >
              This week
            </button>
            <button
              type="button"
              role="tab"
              className="owner-visitors-range-option"
              aria-selected={range === 'all'}
              onClick={() => setRange('all')}
            >
              Everyone
            </button>
          </div>

          {shownVisitors.length === 0 ? (
            <p className="owner-visitors-empty">
              {range === 'week'
                ? 'Nobody has talked to your avatar this week.'
                : 'Nobody has talked to your avatar yet. Share your link to get started.'}
            </p>
          ) : (
            <ul className="owner-visitors-list">
              {shownVisitors.map((visitor, visitorIndex) => (
                <li
                  key={visitor.key}
                  // Staggers the rows' entrance; see `.owner-visitors-list > li`.
                  style={{ '--visitor-index': visitorIndex } as React.CSSProperties}
                >
                  <OwnerVisitorRow visitor={visitor} />
                </li>
              ))}
            </ul>
          )}

          {visitorsLoad.response.hiddenConversationCount > 0 ? (
            <p className="owner-visitors-hidden">
              {describeHiddenConversations(visitorsLoad.response.hiddenConversationCount)}{' '}
              hidden. Some are from people without an account, from before we told people
              you read chats. Others are from people who haven’t accepted the terms.
            </p>
          ) : null}
        </>
      ) : null}
    </main>
  );
}

const describeHiddenConversations = (count: number): string =>
  count === 1 ? '1 conversation is' : `${count} conversations are`;
