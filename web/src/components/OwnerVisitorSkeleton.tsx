import { Skeleton } from './Skeleton';
import { ThreadSkeleton } from './ThreadSkeleton';

/** One visitor's page, empty, while their conversations load. */
export function OwnerVisitorSkeleton() {
  return (
    <div className="owner-visitor-skeleton">
      <div className="owner-visitor-head">
        <Skeleton height={56} shape="circle" />
        <div className="owner-visitor-head-text">
          <Skeleton width={180} height={26} />
          <Skeleton width={260} height={14} />
        </div>
      </div>
      <ThreadSkeleton />
    </div>
  );
}
