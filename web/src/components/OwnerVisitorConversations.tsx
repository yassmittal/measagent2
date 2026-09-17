'use client';

import type { OwnerVisitorResponse } from '@measagent/shared';
import { ATTENTION_CATEGORY_LABELS } from '@measagent/shared/weekly-summary';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Fragment, useEffect, useState } from 'react';
import { formatAbsoluteDate, formatDateDivider } from '@/lib/format-date';
import { loadOwnVisitor } from '@/lib/visitor-client';
import { useSession } from '@/state/SessionProvider';
import { Avatar } from './Avatar';
import { MessageRow } from './MessageRow';
import { describeVisitorActivity } from './OwnerVisitorRow';
import { OwnerVisitorSkeleton } from './OwnerVisitorSkeleton';
import { SignInPrompt } from './SignInPrompt';

type VisitorLoad =
  | { status: 'loading' }
  | { status: 'loaded'; response: OwnerVisitorResponse | null }
  | { status: 'failed'; message: string };

/** One visitor's conversations with the owner's avatar, read-only. */
export function OwnerVisitorConversations({ visitorKey }: { visitorKey: string }) {
  const { status: sessionStatus, user } = useSession();
  const [visitorLoad, setVisitorLoad] = useState<VisitorLoad>({ status: 'loading' });

  const signedInUserId = user?.id ?? null;
  const hasAcceptedTerms = user?.consentAcceptedAt != null;
  useEffect(() => {
    if (signedInUserId === null || !hasAcceptedTerms) return;

    let isMounted = true;
    setVisitorLoad({ status: 'loading' });
    loadOwnVisitor(visitorKey)
      .then((response) => {
        if (isMounted) setVisitorLoad({ status: 'loaded', response });
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setVisitorLoad({
            status: 'failed',
            message:
              error instanceof Error
                ? error.message
                : 'These conversations could not be loaded.',
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [signedInUserId, hasAcceptedTerms, visitorKey]);

  const response = visitorLoad.status === 'loaded' ? visitorLoad.response : null;
  const memory = response?.visitor.memory ?? null;

  return (
    <main className="owner-visitor">
      <Link href="/launch/visitors" className="owner-visitors-back">
        <ArrowLeft size={16} aria-hidden="true" />
        Your visitors
      </Link>

      {sessionStatus === 'anonymous' ? (
        <SignInPrompt
          title="Your visitors"
          lede="Sign in with the Google account you launched your avatar with to read these conversations."
          onSignedIn={() => {}}
        />
      ) : null}

      {sessionStatus !== 'anonymous' && visitorLoad.status === 'loading' ? (
        <OwnerVisitorSkeleton />
      ) : null}

      {visitorLoad.status === 'failed' ? (
        <p className="owner-visitors-error">{visitorLoad.message}</p>
      ) : null}

      {visitorLoad.status === 'loaded' && response === null ? (
        <p className="owner-visitors-empty">
          There is no such visitor among yours.{' '}
          <Link href="/launch/visitors">See all of them</Link>
        </p>
      ) : null}

      {response !== null ? (
        <>
          <header className="owner-visitor-head">
            <Avatar portraitUrl={response.visitor.pictureUrl} size={56} />
            <div className="owner-visitor-head-text">
              <h1 className="owner-visitor-name">{response.visitor.name}</h1>
              <p className="owner-visitor-meta">
                {describeVisitorActivity(response.visitor)} · first seen{' '}
                {formatAbsoluteDate(response.visitor.firstSeenAt)}
              </p>
            </div>
          </header>

          {response.visitor.needsAttention !== null ? (
            <section className="owner-visitor-attention" aria-label="Needs you">
              <h2 className="owner-visitor-attention-title">
                Needs you ·{' '}
                {ATTENTION_CATEGORY_LABELS[response.visitor.needsAttention.category]}
              </h2>
              <p className="owner-visitor-attention-reason">
                {response.visitor.needsAttention.reason}
              </p>
            </section>
          ) : null}

          {memory !== null ? (
            <section
              className="owner-visitor-memory"
              aria-label="What your avatar remembers"
            >
              <h2 className="owner-visitor-section-title">What your avatar remembers</h2>
              {memory.summary !== '' ? (
                <p className="owner-visitor-memory-text">{memory.summary}</p>
              ) : null}
              {memory.interests.length > 0 ? (
                <p className="owner-visitor-memory-text">
                  <strong>Cares about:</strong> {memory.interests.join(', ')}
                </p>
              ) : null}
              {memory.openThreads.length > 0 ? (
                <>
                  <h3 className="owner-visitor-memory-subtitle">Left unfinished</h3>
                  <ul className="owner-visitor-memory-list">
                    {memory.openThreads.map((openThread) => (
                      <li key={openThread}>{openThread}</li>
                    ))}
                  </ul>
                </>
              ) : null}
            </section>
          ) : null}

          {response.conversations.map(({ chat, messages }) => (
            <section key={chat.id} className="owner-visitor-conversation">
              <h2 className="owner-visitor-conversation-title">
                {chat.title ?? 'Conversation'}
              </h2>
              <p className="owner-visitor-conversation-dates">
                Started {formatAbsoluteDate(chat.createdAt)}
              </p>
              <div className="thread-items">
                {messages.map((message, index) => {
                  const previous = messages[index - 1];
                  const divider = formatDateDivider(message.at);
                  const startsNewDay =
                    divider !== '' &&
                    (previous === undefined ||
                      formatDateDivider(previous.at) !== divider);

                  return (
                    <Fragment key={message.id}>
                      {startsNewDay ? (
                        <div className="date-divider">{divider}</div>
                      ) : null}
                      <MessageRow message={message} entering={false} />
                    </Fragment>
                  );
                })}
              </div>
            </section>
          ))}
        </>
      ) : null}
    </main>
  );
}
