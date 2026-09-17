import type { AvatarProfile } from '@measagent/shared/avatars';
import Link from 'next/link';
import { HOME_INTRODUCTION, HOME_LAUNCH_NOTE } from '@/content/home';
import { pickHeroAvatars } from '@/lib/hero-avatars';
import { PRODUCT_NAME, PRODUCT_TAGLINE } from '@/lib/product';
import { AvatarCard } from './AvatarCard';
import { AvatarHero } from './AvatarHero';

export function AvatarDirectory({ avatars }: { avatars: AvatarProfile[] }) {
  const heroAvatars = pickHeroAvatars(avatars);
  const taglineWords = PRODUCT_TAGLINE.split(' ');

  return (
    <main className="avatar-directory">
      <header className="avatar-directory-head">
        <p className="avatar-directory-wordmark">{PRODUCT_NAME}</p>
        {heroAvatars.length > 0 ? <AvatarHero avatars={heroAvatars} /> : null}
        {/* The tagline is the heading: it says what the site is, where the
            product name alone would not. Each word is its own span so it can
            come into focus in turn; the text a crawler reads is unchanged. */}
        <h1 className="avatar-directory-title">
          {taglineWords.map((word, index) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: the tagline is a constant, and a word can repeat in it.
              key={index}
              className="avatar-directory-title-word"
              style={{ '--word-index': index } as React.CSSProperties}
            >
              {word}
              {index < taglineWords.length - 1 ? ' ' : null}
            </span>
          ))}
        </h1>
        <Link href="/launch" className="avatar-directory-launch">
          Launch your avatar
        </Link>
      </header>

      {avatars.length === 0 ? (
        <p className="avatar-directory-empty">
          No avatars yet. Be the first to launch one.
        </p>
      ) : (
        <section
          className="avatar-directory-all"
          aria-labelledby="avatar-directory-all-heading"
        >
          <h2 id="avatar-directory-all-heading" className="avatar-directory-all-heading">
            All avatars
          </h2>
          <ul className="avatar-directory-grid">
            {avatars.map((avatar) => (
              <li key={avatar.id}>
                <AvatarCard avatar={avatar} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="directory-intro" aria-labelledby="directory-intro-heading">
        <h2 id="directory-intro-heading" className="directory-intro-heading">
          {HOME_INTRODUCTION.heading}
        </h2>
        {HOME_INTRODUCTION.paragraphs.map((paragraph) => (
          <p key={paragraph} className="directory-intro-text">
            {paragraph}
          </p>
        ))}
        <ol className="directory-intro-steps">
          {HOME_INTRODUCTION.steps?.map((step) => (
            <li key={step} className="directory-intro-step">
              {step}
            </li>
          ))}
        </ol>
        <p className="directory-intro-text">
          {HOME_LAUNCH_NOTE}{' '}
          <Link href="/how-it-works" className="directory-intro-link">
            How it works
          </Link>
        </p>
      </section>
    </main>
  );
}
