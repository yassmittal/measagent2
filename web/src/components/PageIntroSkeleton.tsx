import { Skeleton } from './Skeleton';

/** Stands in for a page's title and lede while the session is still being read. */
export function PageIntroSkeleton() {
  return (
    <div className="page-intro-skeleton" role="status" aria-label="Loading">
      <Skeleton width="55%" height={34} />
      <Skeleton width="90%" height={16} />
      <Skeleton width="70%" height={16} />
    </div>
  );
}
