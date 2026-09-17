import { Skeleton } from './Skeleton';

/** The shape of a short exchange, shown while a conversation loads. */
export function ThreadSkeleton() {
  return (
    <div className="thread-skeleton" role="status" aria-label="Loading the conversation">
      <div className="thread-skeleton-user">
        <Skeleton height={48} shape="pill" />
      </div>
      <div className="thread-skeleton-reply">
        <Skeleton height={16} />
        <Skeleton height={16} />
        <Skeleton width="62%" height={16} />
      </div>
      <div className="thread-skeleton-user">
        <Skeleton width="70%" height={48} shape="pill" />
      </div>
    </div>
  );
}
