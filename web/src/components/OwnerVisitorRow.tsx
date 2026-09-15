import type { OwnerVisitor } from '@measagent/shared';
import { ATTENTION_CATEGORY_LABELS } from '@measagent/shared/weekly-summary';
import Link from 'next/link';
import { formatDateDivider } from '@/lib/format-date';
import { Avatar } from './Avatar';

export function OwnerVisitorRow({ visitor }: { visitor: OwnerVisitor }) {
  return (
    <Link href={`/launch/visitors/${visitor.key}`} className="owner-visitor-row">
      <Avatar portraitUrl={visitor.pictureUrl} size={40} />
      <span className="owner-visitor-row-text">
        <span className="owner-visitor-row-name">{visitor.name}</span>
        {visitor.needsAttention !== null ? (
          <span className="owner-visitor-row-attention">
            Needs you · {ATTENTION_CATEGORY_LABELS[visitor.needsAttention.category]}
          </span>
        ) : null}
        <span className="owner-visitor-row-meta">{describeVisitorActivity(visitor)}</span>
        {visitor.memory !== null && visitor.memory.summary !== '' ? (
          <span className="owner-visitor-row-summary">{visitor.memory.summary}</span>
        ) : null}
      </span>
    </Link>
  );
}

export function describeVisitorActivity(visitor: OwnerVisitor): string {
  const conversations =
    visitor.conversationCount === 1
      ? '1 conversation'
      : `${visitor.conversationCount} conversations`;
  const messages =
    visitor.messageCount === 1 ? '1 message' : `${visitor.messageCount} messages`;
  return `${conversations} · ${messages} · last seen ${formatDateDivider(visitor.lastSeenAt).toLowerCase()}`;
}
