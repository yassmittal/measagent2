import type { ReactNode } from 'react';

interface StatusPageProps {
  title: string;
  message: string;
  /** The way forward: a link or a button styled with `.status-page-action`. */
  children: ReactNode;
}

/** A whole page that says one thing and offers one way on: not found, failed, paused. */
export function StatusPage({ title, message, children }: StatusPageProps) {
  return (
    <main className="status-page">
      <h1 className="status-page-title">{title}</h1>
      <p className="status-page-message">{message}</p>
      {children}
    </main>
  );
}
