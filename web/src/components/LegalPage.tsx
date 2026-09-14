import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { formatAbsoluteDate } from '@/lib/format-date';

interface LegalPageProps {
  title: string;
  updatedAt: string;
  children: ReactNode;
}

export function LegalPage({ title, updatedAt, children }: LegalPageProps) {
  return (
    <div className="legal-page">
      <div className="legal-page-inner">
        <Link href="/" className="legal-back">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to the conversation
        </Link>
        <h1 className="legal-title">{title}</h1>
        <p className="legal-meta">Last updated {formatAbsoluteDate(updatedAt)}</p>
        <div className="legal-body">{children}</div>
      </div>
    </div>
  );
}
