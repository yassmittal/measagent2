'use client';

import { X } from 'lucide-react';
import { useSession } from '@/state/SessionProvider';

export function ThreadClaimedNotice() {
  const { claimedThreadCount, dismissClaimedThreads } = useSession();

  if (claimedThreadCount === 0) return null;

  return (
    <div className="migration-notice" role="status">
      <p className="migration-notice-text">
        {claimedThreadCount === 1
          ? 'The conversation you had before signing in is now saved to your account.'
          : `The ${claimedThreadCount} conversations you had before signing in are now saved to your account.`}
      </p>
      <button
        type="button"
        className="migration-notice-dismiss"
        aria-label="Dismiss"
        onClick={dismissClaimedThreads}
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
