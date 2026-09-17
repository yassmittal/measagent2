import { Skeleton } from './Skeleton';

const PLACEHOLDER_VISITOR_COUNT = 3;

/** The visitors list's rows, empty, while the owner's visitors load. */
export function OwnerVisitorsSkeleton() {
  return (
    <div
      className="owner-visitors-skeleton"
      role="status"
      aria-label="Loading your visitors"
    >
      {Array.from({ length: PLACEHOLDER_VISITOR_COUNT }, (_, visitorIndex) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: identical placeholders that never reorder.
        <div key={visitorIndex} className="owner-visitor-row">
          <Skeleton height={40} shape="circle" />
          <span className="owner-visitor-row-text">
            <Skeleton width={150} height={17} />
            <Skeleton width={230} height={13} />
            <Skeleton width={320} height={14} />
          </span>
        </div>
      ))}
    </div>
  );
}
