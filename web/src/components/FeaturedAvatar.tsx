import type { AvatarProfile } from '@measagent/shared/avatars';
import { ArrowUp } from 'lucide-react';
import Link from 'next/link';
import { ASK_DRAFT_PARAM, buildAskHref } from '@/lib/ask-draft';
import { toLargeGooglePhotoUrl } from '@/lib/google-photo';
import { PLACEHOLDER_PORTRAIT_SRC } from '@/lib/product';

/**
 * One avatar, askable from the front page. A plain GET form, so it works
 * before any JavaScript has loaded: the question lands in that avatar's
 * composer, where the visitor sends it themselves.
 */
export function FeaturedAvatar({ avatar }: { avatar: AvatarProfile }) {
  const firstName = avatar.subject === 'person' ? avatar.name.split(' ')[0] : avatar.name;

  return (
    <section className="featured-avatar" aria-labelledby="featured-avatar-name">
      <Link href={`/${avatar.handle}`} className="featured-avatar-portrait" tabIndex={-1}>
        {/* biome-ignore lint/performance/noImgElement: a Google-hosted photo or a static SVG, as in `Avatar`. */}
        <img
          src={
            avatar.pictureUrl === null
              ? PLACEHOLDER_PORTRAIT_SRC
              : toLargeGooglePhotoUrl(avatar.pictureUrl)
          }
          alt={`Portrait of ${avatar.name}`}
          referrerPolicy="no-referrer"
        />
      </Link>

      <div className="featured-avatar-body">
        <p className="featured-avatar-eyebrow">Try one now</p>
        <h2 id="featured-avatar-name" className="featured-avatar-name">
          <Link href={`/${avatar.handle}`} className="featured-avatar-name-link">
            {avatar.name}
          </Link>
        </h2>
        <p className="featured-avatar-bio">{avatar.bio}</p>

        <form action={`/${avatar.handle}`} method="get" className="featured-avatar-ask">
          <input
            name={ASK_DRAFT_PARAM}
            className="featured-avatar-ask-input"
            placeholder={`Ask ${firstName} anything…`}
            aria-label={`Ask ${avatar.name} a question`}
            autoComplete="off"
            required
          />
          <button type="submit" className="featured-avatar-ask-send" aria-label="Ask">
            <ArrowUp size={18} aria-hidden="true" />
          </button>
        </form>

        {avatar.askMeAbout.length > 0 ? (
          <ul className="featured-avatar-topics" aria-label={`Ask ${avatar.name} about`}>
            {avatar.askMeAbout.map((topic) => (
              <li key={topic}>
                <Link
                  href={buildAskHref(avatar.handle, topic)}
                  className="featured-avatar-topic"
                >
                  {topic}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
