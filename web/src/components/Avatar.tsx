import { PLACEHOLDER_PORTRAIT_SRC } from '@/lib/product';

interface AvatarProps {
  /** Null draws the placeholder portrait. */
  portraitUrl: string | null;
  size?: number;
  label?: string;
}

export function Avatar({ portraitUrl, size, label }: AvatarProps) {
  const style =
    size !== undefined
      ? ({ '--avatar-size': `${size}px` } as React.CSSProperties)
      : undefined;

  const portrait = (
    // biome-ignore lint/performance/noImgElement: a Google-hosted photo or a static SVG — next/image would need a remote pattern for the one and cannot optimise the other, and the wrapper element it adds would break the `.avatar > img` sizing rule.
    <img
      src={portraitUrl ?? PLACEHOLDER_PORTRAIT_SRC}
      alt=""
      // Google's photo CDN refuses requests that carry a referrer.
      referrerPolicy="no-referrer"
    />
  );

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
