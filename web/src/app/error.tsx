'use client';

import { StatusPage } from '@/components/StatusPage';

interface ErrorPageProps {
  error: Error & { digest?: string };
  retry: () => void;
}

/** Most failures here are the api being briefly out of reach, so trying again is the way on. */
export default function ErrorPage({ retry }: ErrorPageProps) {
  return (
    <StatusPage
      title="Something went wrong"
      message="This page could not load just now. It is usually a short hiccup."
    >
      <button type="button" className="status-page-action" onClick={retry}>
        Try again
      </button>
    </StatusPage>
  );
}
