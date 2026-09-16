import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { AvatarProfile } from '@measagent/shared/avatars';
import { ImageResponse } from 'next/og';
import { PRODUCT_NAME, SITE_URL } from '@/lib/product';

/**
 * Share images. Satori renders a subset of CSS (flexbox only), so these are
 * inline styles rather than the stylesheet — the one place in the web app that
 * is true. Colours are the stylesheet's tokens, copied.
 *
 * Names in scripts the bundled font lacks (Devanagari, CJK, Arabic…) still
 * render: `next/og` fetches the matching Noto font for those characters itself.
 */

export const OG_IMAGE_SIZE = { width: 1200, height: 630 };
export const OG_IMAGE_CONTENT_TYPE = 'image/png';

const COLOR_BACKGROUND = '#fbfbfb';
const COLOR_TEXT = '#09090b';
const COLOR_TEXT_MUTED = '#6b7280';
const COLOR_ACCENT = '#1877f2';
const COLOR_AVATAR_BACKGROUND = '#eef1f6';

const MAX_NAME_LENGTH = 40;
const MAX_BIO_LENGTH = 140;
const MAX_TITLE_LENGTH = 90;

const SITE_HOST = new URL(SITE_URL).host;

function truncateText(text: string, maxLength: number): string {
  const characters = Array.from(text.trim());
  return characters.length <= maxLength
    ? characters.join('')
    : `${characters
        .slice(0, maxLength - 1)
        .join('')
        .trimEnd()}…`;
}

/** A long name shrinks before it wraps, so a 40-character name still fits two lines. */
function nameFontSize(name: string): number {
  const length = Array.from(name).length;
  if (length <= 16) return 76;
  if (length <= 28) return 60;
  return 48;
}

/**
 * Google serves profile photos at the size asked for in the URL. The stored
 * URL asks for 96px, which would blur at share-image size.
 */
function toLargeGooglePhotoUrl(pictureUrl: string): string {
  return pictureUrl.replace(/=s\d+-c$/, '=s512-c');
}

let placeholderPortraitDataUrl: Promise<string> | null = null;

function readPlaceholderPortraitDataUrl(): Promise<string> {
  placeholderPortraitDataUrl ??= readFile(
    join(process.cwd(), 'public/avatar/portrait.svg'),
    'base64',
  ).then((svgBase64) => `data:image/svg+xml;base64,${svgBase64}`);
  return placeholderPortraitDataUrl;
}

function BrandFooter() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 28 }}>
      <div
        style={{
          display: 'flex',
          width: 36,
          height: 36,
          borderRadius: 10,
          background: COLOR_ACCENT,
        }}
      />
      <span style={{ color: COLOR_TEXT }}>{PRODUCT_NAME}</span>
      <span style={{ color: COLOR_TEXT_MUTED }}>{SITE_HOST}</span>
    </div>
  );
}

interface SiteOgImageInput {
  eyebrow: string;
  title: string;
}

/** The front page and every content page: a label, a heading, the brand. */
export function renderSiteOgImage({ eyebrow, title }: SiteOgImageInput): ImageResponse {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 80,
        background: COLOR_BACKGROUND,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <span style={{ color: COLOR_ACCENT, fontSize: 32 }}>{eyebrow}</span>
        <span
          style={{ color: COLOR_TEXT, fontSize: 68, lineHeight: 1.12, letterSpacing: -2 }}
        >
          {truncateText(title, MAX_TITLE_LENGTH)}
        </span>
      </div>
      <BrandFooter />
    </div>,
    OG_IMAGE_SIZE,
  );
}

/** An avatar's link, shared: their photo, their name, and what the link is for. */
export async function renderAvatarOgImage(avatar: AvatarProfile): Promise<ImageResponse> {
  const portraitSrc =
    avatar.pictureUrl === null
      ? await readPlaceholderPortraitDataUrl()
      : toLargeGooglePhotoUrl(avatar.pictureUrl);
  const name = truncateText(avatar.name, MAX_NAME_LENGTH);

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 80,
        background: COLOR_BACKGROUND,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 64 }}>
        {/* biome-ignore lint/performance/noImgElement: Satori renders plain <img>; next/image does not exist here. */}
        <img
          src={portraitSrc}
          alt=""
          width={300}
          height={300}
          style={{
            borderRadius: 150,
            background: COLOR_AVATAR_BACKGROUND,
            objectFit: 'cover',
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
          <span style={{ color: COLOR_ACCENT, fontSize: 34 }}>Talk to my AI avatar</span>
          <span
            style={{
              color: COLOR_TEXT,
              fontSize: nameFontSize(name),
              lineHeight: 1.1,
              letterSpacing: -1.5,
            }}
          >
            {name}
          </span>
          <span style={{ color: COLOR_TEXT_MUTED, fontSize: 30, lineHeight: 1.4 }}>
            {truncateText(avatar.bio, MAX_BIO_LENGTH)}
          </span>
        </div>
      </div>
      <BrandFooter />
    </div>,
    OG_IMAGE_SIZE,
  );
}
