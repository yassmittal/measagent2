'use client';

import type { AvatarProfile } from '@measagent/shared/avatars';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toLargeGooglePhotoUrl } from '@/lib/google-photo';
import { PLACEHOLDER_PORTRAIT_SRC } from '@/lib/product';
import { AvatarHeroAsk } from './AvatarHeroAsk';
import { AvatarHeroStreams } from './AvatarHeroStreams';

// Also the length of the pager's fill in `directory.css`; change both together.
const PORTRAIT_HOLD_MS = 6500;

/**
 * The front page's centrepiece: an arched portrait you can ask straight away,
 * turning through the listed avatars. It holds still while a visitor points
 * at it, focuses it or has started typing, so nobody's question is ever
 * carried off to a different avatar.
 */
export function AvatarHero({ avatars }: { avatars: AvatarProfile[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setHovered] = useState(false);
  const [isFocused, setFocused] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [isMotionAllowed, setMotionAllowed] = useState(false);

  useEffect(() => {
    setMotionAllowed(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const isHeld = isHovered || isFocused || hasDraft;
  const isTurning = isMotionAllowed && !isHeld && avatars.length > 1;

  // biome-ignore lint/correctness/useExhaustiveDependencies: `activeIndex` restarts the hold whenever the portrait changes, including by the pager.
  useEffect(() => {
    if (!isTurning) return;
    const timer = window.setTimeout(
      () => setActiveIndex((current) => (current + 1) % avatars.length),
      PORTRAIT_HOLD_MS,
    );
    return () => window.clearTimeout(timer);
  }, [isTurning, activeIndex, avatars.length]);

  const activeAvatar = avatars[activeIndex] ?? avatars[0];
  if (activeAvatar === undefined) return null;

  return (
    <div className="avatar-hero">
      <AvatarHeroStreams avatars={avatars} />

      <section
        className="avatar-hero-card"
        aria-labelledby="avatar-hero-name"
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
        }}
      >
        <div className="avatar-hero-portraits">
          {avatars.map((avatar, index) => (
            // biome-ignore lint/performance/noImgElement: a Google-hosted photo or a static SVG, as in `Avatar`.
            <img
              key={avatar.id}
              className={`avatar-hero-portrait${index === activeIndex ? ' is-active' : ''}`}
              src={
                avatar.pictureUrl === null
                  ? PLACEHOLDER_PORTRAIT_SRC
                  : toLargeGooglePhotoUrl(avatar.pictureUrl)
              }
              alt={index === activeIndex ? `Portrait of ${avatar.name}` : ''}
              referrerPolicy="no-referrer"
            />
          ))}
        </div>

        {/* Keyed by avatar, so each arrival plays the caption's entrance. */}
        <div key={`caption-${activeAvatar.id}`} className="avatar-hero-caption">
          <h2 id="avatar-hero-name" className="avatar-hero-name">
            <Link href={`/${activeAvatar.handle}`} className="avatar-hero-name-link">
              {activeAvatar.name}
            </Link>
          </h2>
          <p className="avatar-hero-bio">{activeAvatar.bio}</p>
        </div>

        <AvatarHeroAsk
          key={`ask-${activeAvatar.id}`}
          avatar={activeAvatar}
          onDraftChange={setHasDraft}
        />
      </section>

      {avatars.length > 1 ? (
        <div className="avatar-hero-pager">
          {avatars.map((avatar, index) => (
            <button
              key={avatar.id}
              type="button"
              className={`avatar-hero-pager-dot${index === activeIndex ? ' is-active' : ''}`}
              aria-label={`Show ${avatar.name}`}
              aria-current={index === activeIndex ? 'true' : undefined}
              onClick={() => setActiveIndex(index)}
            >
              {index === activeIndex && isTurning ? (
                // Remounted per turn so the fill always starts empty.
                <span
                  key={`${activeIndex}-${isTurning}`}
                  className="avatar-hero-pager-fill"
                />
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
