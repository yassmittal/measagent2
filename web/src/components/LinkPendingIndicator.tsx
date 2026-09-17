'use client';

import { LoaderCircle } from 'lucide-react';
import { useLinkStatus } from 'next/link';

/**
 * A spinner in the corner of the link it sits inside, shown while that link's
 * page is on its way. Always rendered and only faded, so it never moves the
 * layout. Avatar pages have no route-level `loading.tsx` on purpose: streaming
 * one would cost them their real 404 and redirect status codes.
 */
export function LinkPendingIndicator() {
  const { pending: isPending } = useLinkStatus();

  return (
    <span
      className="link-pending-indicator"
      data-pending={isPending ? '' : undefined}
      aria-hidden="true"
    >
      <LoaderCircle className="spinner" size={16} />
    </span>
  );
}
