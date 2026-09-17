import { Skeleton } from './Skeleton';

const PLACEHOLDER_FIELD_COUNT = 3;

/** The launch form's outline, drawn in the form's own layout while the owner's avatar loads. */
export function AvatarFormSkeleton() {
  return (
    <div className="avatar-form-skeleton" role="status" aria-label="Loading your avatar">
      <div className="avatar-form-identity">
        <Skeleton height={56} shape="circle" />
        <span className="avatar-form-identity-text">
          <Skeleton width={160} height={20} />
          <Skeleton width={130} height={13} />
        </span>
      </div>
      {Array.from({ length: PLACEHOLDER_FIELD_COUNT }, (_, fieldIndex) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: identical placeholders that never reorder.
        <div key={fieldIndex} className="avatar-form-field">
          <Skeleton width={110} height={16} />
          <Skeleton height={96} />
        </div>
      ))}
    </div>
  );
}
