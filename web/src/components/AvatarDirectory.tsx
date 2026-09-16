import type { AvatarProfile } from '@measagent/shared/avatars';
import Link from 'next/link';
import { HOME_INTRODUCTION, HOME_LAUNCH_NOTE } from '@/content/home';
import { pickFeaturedAvatar } from '@/lib/featured-avatar';
import { PRODUCT_NAME, PRODUCT_TAGLINE } from '@/lib/product';
import { AvatarCard } from './AvatarCard';
import { FeaturedAvatar } from './FeaturedAvatar';

export function AvatarDirectory({ avatars }: { avatars: AvatarProfile[] }) {
  const featuredAvatar = pickFeaturedAvatar(avatars);

  return (
    <main className="avatar-directory">
      <header className="avatar-directory-head">
        <p className="avatar-directory-wordmark">{PRODUCT_NAME}</p>
        {/* The tagline is the heading: it says what the site is, where the
            product name alone would not. */}
        <h1 className="avatar-directory-title">{PRODUCT_TAGLINE}</h1>
        <Link href="/launch" className="avatar-directory-launch">
          Launch your avatar
        </Link>
      </header>

      {featuredAvatar !== null ? <FeaturedAvatar avatar={featuredAvatar} /> : null}

      {avatars.length === 0 ? (
        <p className="avatar-directory-empty">
          No avatars are listed yet. Be the first to launch one.
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
