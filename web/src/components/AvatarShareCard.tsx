'use client';

import type { OwnAvatar } from '@measagent/shared/avatars';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { SITE_URL } from '@/lib/product';

const COPIED_CONFIRMATION_MS = 2000;

/**
 * The link is how an avatar gets found: from an owner's bio, email signature or
 * website. The preview is the image the link unfurls to when it is shared.
 */
export function AvatarShareCard({ avatar }: { avatar: OwnAvatar }) {
  const [hasCopied, setHasCopied] = useState(false);
  const avatarUrl = `${SITE_URL}/${avatar.handle}`;

  const copyAvatarUrl = async () => {
    try {
      await navigator.clipboard.writeText(avatarUrl);
      setHasCopied(true);
      window.setTimeout(() => setHasCopied(false), COPIED_CONFIRMATION_MS);
    } catch {
      // Clipboard access can be refused; the link is on screen to copy by hand.
    }
  };

  return (
    <section className="avatar-share-card" aria-labelledby="avatar-share-card-title">
      <h2 id="avatar-share-card-title" className="avatar-share-card-title">
        Share your avatar
      </h2>
      <p className="avatar-share-card-text">
        Put your link where people already try to reach you — your bio, your email
        signature, your website. This is how it looks when shared.
      </p>
      {/* biome-ignore lint/performance/noImgElement: the generated share image is already sized for this; next/image would re-encode a PNG made on demand. */}
      <img
        className="avatar-share-card-preview"
        src={`/${avatar.handle}/opengraph-image`}
        alt={`How ${avatarUrl} looks when shared: portrait, name and bio`}
        width={1200}
        height={630}
        loading="lazy"
      />
      <div className="avatar-share-card-row">
        <code className="avatar-share-card-url">{avatarUrl}</code>
        <button type="button" className="avatar-share-card-copy" onClick={copyAvatarUrl}>
          {hasCopied ? (
            <Check size={16} aria-hidden="true" />
          ) : (
            <Copy size={16} aria-hidden="true" />
          )}
          {hasCopied ? 'Copied' : 'Copy link'}
        </button>
      </div>
    </section>
  );
}
