import { AVATAR_PORTRAIT_SRC } from '@/lib/persona';

interface AvatarProps {
  size?: number;
  label?: string;
}

export function Avatar({ size, label }: AvatarProps) {
  const style =
    size !== undefined
      ? ({ '--avatar-size': `${size}px` } as React.CSSProperties)
      : undefined;

  // biome-ignore lint/performance/noImgElement: static SVG — next/image cannot optimise SVG and its wrapper would break the reference's `.avatar > img` sizing.
  const portrait = <img src={AVATAR_PORTRAIT_SRC} alt="" />;

  if (label === undefined) {
    return (
      <span className="avatar" style={style} aria-hidden="true">
        {portrait}
      </span>
    );
  }

  return (
    <span className="avatar" style={style} role="img" aria-label={label}>
      {portrait}
    </span>
  );
}
