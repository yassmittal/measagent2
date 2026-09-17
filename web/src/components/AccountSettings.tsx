'use client';

import type { UserProfile } from '@measagent/shared';
import Link from 'next/link';
import { useState } from 'react';
import { formatAbsoluteDate } from '@/lib/format-date';
import { forgetRelationship } from '@/lib/relationship-client';
import { BusyButtonLabel } from './BusyButtonLabel';

interface AccountSettingsProps {
  user: UserProfile;
  onSignOut: () => void;
}

type ForgetEverythingStep = 'idle' | 'confirming' | 'forgetting' | 'forgotten' | 'failed';

export function AccountSettings({ user, onSignOut }: AccountSettingsProps) {
  const [forgetStep, setForgetStep] = useState<ForgetEverythingStep>('idle');

  // Two presses rather than a browser dialog: forgetting cannot be undone, and
  // the second press is on the same spot the first one was.
  const forgetEverything = async () => {
    if (forgetStep !== 'confirming') {
      setForgetStep('confirming');
      return;
    }
    setForgetStep('forgetting');
    try {
      await forgetRelationship(null);
      setForgetStep('forgotten');
    } catch {
      setForgetStep('failed');
    }
  };

  return (
    <>
      <section className="settings-section">
        <h3 className="settings-section-title">Account</h3>
        <div className="settings-row">
          <span className="settings-row-label">
            <span className="settings-row-name">{user.name}</span>
          </span>
          <span className="settings-row-value">{user.email}</span>
        </div>
      </section>

      <section className="settings-section">
        <h3 className="settings-section-title">Your data</h3>
        <p className="settings-note">
          Your chats are saved to this account so they’re here next time, and each avatar
          remembers what you tell it. The person behind an avatar can read your chats with
          it. More details are in the <Link href="/privacy">privacy notice</Link>.
        </p>
        {user.consentAcceptedAt !== null ? (
          <p className="settings-note">
            You accepted the terms on {formatAbsoluteDate(user.consentAcceptedAt)}.
          </p>
        ) : null}
      </section>

      <section className="settings-section">
        <h3 className="settings-section-title">Memory</h3>
        <p className="settings-note">
          {forgetStep === 'forgotten'
            ? 'Done. No avatar remembers anything you have said so far.'
            : 'Make every avatar forget what it remembers about you. Your chats stay, but avatars won’t use anything you already said.'}
        </p>
        {forgetStep !== 'forgotten' ? (
          <button
            type="button"
            className="settings-forget"
            onClick={forgetEverything}
            disabled={forgetStep === 'forgetting'}
          >
            <BusyButtonLabel isBusy={forgetStep === 'forgetting'}>
              {forgetStep === 'confirming'
                ? 'Yes, forget everything'
                : forgetStep === 'forgetting'
                  ? 'Forgetting…'
                  : 'Forget everything'}
            </BusyButtonLabel>
          </button>
        ) : null}
        {forgetStep === 'failed' ? (
          <p className="settings-note">That did not go through. Try again.</p>
        ) : null}
      </section>

      <button type="button" className="settings-signout" onClick={onSignOut}>
        Sign out
      </button>
    </>
  );
}
