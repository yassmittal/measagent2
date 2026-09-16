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

  // With a label the portrait is content, so the image itself carries the alt
  // text (which search engines read too); without one it sits beside a visible
  // name and would only repeat it.
  return (
    <span
      className="avatar"
      style={style}
      aria-hidden={label === undefined ? true : undefined}
    >
      {/* biome-ignore lint/performance/noImgElement: a Google-hosted photo or a static SVG — next/image would need a remote pattern for the one and cannot optimise the other, and the wrapper element it adds would break the `.avatar > img` sizing rule. */}
      <img
        src={portraitUrl ?? PLACEHOLDER_PORTRAIT_SRC}
        alt={label === undefined ? '' : `Portrait of ${label}`}
        // Google's photo CDN refuses requests that carry a referrer.
        referrerPolicy="no-referrer"
      />
    </span>
  );
}
