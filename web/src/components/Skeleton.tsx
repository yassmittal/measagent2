type SkeletonShape = 'block' | 'pill' | 'circle';

/** Pixels as a number, or any CSS length as a string. */
type CssLength = number | string;

interface SkeletonProps {
  /** The full width of its container when omitted; a circle's height. */
  width?: CssLength;
  height: CssLength;
  shape?: SkeletonShape;
}

const SHAPE_RADII: Record<SkeletonShape, string> = {
  block: 'var(--r-xs)',
  pill: 'var(--r-pill)',
  circle: '50%',
};

/** A grey stand-in for content that is still loading. Decorative: the region around it announces the wait. */
export function Skeleton({ width, height, shape = 'block' }: SkeletonProps) {
  const style = {
    '--skeleton-width': toCssLength(width ?? (shape === 'circle' ? height : '100%')),
    '--skeleton-height': toCssLength(height),
    '--skeleton-radius': SHAPE_RADII[shape],
  } as React.CSSProperties;

  return <span className="skeleton" style={style} aria-hidden="true" />;
}

const toCssLength = (length: CssLength): string =>
  typeof length === 'number' ? `${length}px` : length;
