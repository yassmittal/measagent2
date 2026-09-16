import type { AvatarProfile } from '@measagent/shared/avatars';
import Link from 'next/link';
import { HOME_INTRODUCTION, HOME_LAUNCH_NOTE } from '@/content/home';
import { PRODUCT_NAME, PRODUCT_TAGLINE } from '@/lib/product';
import { AvatarCard } from './AvatarCard';

export function AvatarDirectory({ avatars }: { avatars: AvatarProfile[] }) {
  return (
    <main className="avatar-directory">
      <header className="avatar-directory-head">
        <h1 className="avatar-directory-title">{PRODUCT_NAME}</h1>
        <p className="avatar-directory-lede">{PRODUCT_TAGLINE}</p>
        <Link href="/launch" className="avatar-directory-launch">
          Launch your avatar
        </Link>
      </header>

      {avatars.length === 0 ? (
        <p className="avatar-directory-empty">
          No avatars are listed yet. Be the first to launch one.
        </p>
      ) : (
        <ul className="avatar-directory-grid">
          {avatars.map((avatar) => (
            <li key={avatar.id}>
              <AvatarCard avatar={avatar} />
            </li>
          ))}
        </ul>
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
