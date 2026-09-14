'use client';

import type { UserProfile } from '@measagent/shared';
import Link from 'next/link';
import { formatAbsoluteDate } from '@/lib/format-date';

interface AccountSettingsProps {
  user: UserProfile;
  onSignOut: () => void;
}

export function AccountSettings({ user, onSignOut }: AccountSettingsProps) {
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
          Your conversations are stored against this account so they are here next time.
          What that means is in the <Link href="/privacy">privacy notice</Link>.
        </p>
        {user.consentAcceptedAt !== null ? (
          <p className="settings-note">
            You accepted the terms on {formatAbsoluteDate(user.consentAcceptedAt)}.
          </p>
        ) : null}
      </section>

      <button type="button" className="settings-signout" onClick={onSignOut}>
        Sign out
      </button>
    </>
  );
}
