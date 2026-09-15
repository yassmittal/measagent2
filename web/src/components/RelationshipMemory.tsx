'use client';

import type { RelationshipResponse } from '@measagent/shared';
import { useState } from 'react';
import { formatAbsoluteDate } from '@/lib/format-date';

interface RelationshipMemoryProps {
  avatarName: string;
  relationship: RelationshipResponse;
  onForget: () => Promise<void>;
}

/** The body of the panel that shows a visitor what one avatar remembers about them. */
export function RelationshipMemory({
  avatarName,
  relationship,
  onForget,
}: RelationshipMemoryProps) {
  const [isForgetting, setForgetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { memory } = relationship;

  const forget = async () => {
    setForgetting(true);
    setError(null);
    try {
      await onForget();
    } catch {
      setError('That did not go through. Try again.');
    } finally {
      setForgetting(false);
    }
  };

  return (
    <>
      {memory === null ? (
        <section className="settings-section">
          <p className="settings-note">
            Nothing yet. A while after a conversation goes quiet, what {avatarName}&apos;s
            avatar remembers about you shows up here.
          </p>
        </section>
      ) : (
        <>
          {memory.summary !== '' ? (
            <section className="settings-section">
              <h3 className="settings-section-title">About you</h3>
              <p className="settings-note">{memory.summary}</p>
            </section>
          ) : null}
          {memory.interests.length > 0 ? (
            <section className="settings-section">
              <h3 className="settings-section-title">What you care about</h3>
              <p className="settings-note">{memory.interests.join(', ')}</p>
            </section>
          ) : null}
          {memory.openThreads.length > 0 ? (
            <section className="settings-section">
              <h3 className="settings-section-title">Left unfinished</h3>
              {memory.openThreads.map((openThread) => (
                <p key={openThread} className="settings-note">
                  {openThread}
                </p>
              ))}
            </section>
          ) : null}
        </>
      )}

      <section className="settings-section">
        <h3 className="settings-section-title">Forget</h3>
        <p className="settings-note">
          {relationship.memoryUpdatedAt !== null
            ? `Last updated ${formatAbsoluteDate(relationship.memoryUpdatedAt)}. `
            : null}
          Forgetting clears these notes. Your conversations stay, but nothing you have
          already said is read back in.
        </p>
        <button
          type="button"
          className="settings-forget"
          onClick={forget}
          disabled={isForgetting || memory === null}
        >
          {isForgetting ? 'Forgetting…' : `Make ${avatarName}'s avatar forget me`}
        </button>
        {error !== null ? <p className="settings-note">{error}</p> : null}
      </section>
    </>
  );
}
