import type { AvatarForReview, ReviewAvatarRequest } from '@measagent/shared/admin';
import { reviewAvatarAction } from '@/app/actions';

const WEB_BASE_URL = process.env.MA_WEB_BASE_URL ?? 'http://localhost:3000';

/** Rendered on the server only, so a fixed locale cannot disagree with a browser's. */
const REVIEW_DATE_FORMAT = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

interface ReviewDecision {
  listing: ReviewAvatarRequest['listing'];
  label: string;
  isPrimary: boolean;
}

/** What can be done from each column: a pending avatar is decided, a decided one reversed. */
function decisionsFor(avatar: AvatarForReview): ReviewDecision[] {
  if (avatar.listing === 'listed') {
    return [{ listing: 'declined', label: 'Unlist', isPrimary: false }];
  }
  if (avatar.listing === 'declined') {
    return [{ listing: 'listed', label: 'List', isPrimary: true }];
  }
  return [
    { listing: 'listed', label: 'List', isPrimary: true },
    { listing: 'declined', label: 'Decline', isPrimary: false },
  ];
}

export function ReviewCard({ avatar }: { avatar: AvatarForReview }) {
  return (
    <article className="review-card">
      <header className="review-card-head">
        {avatar.pictureUrl !== null ? (
          // biome-ignore lint/performance/noImgElement: a Google-hosted photo in an internal tool; next/image would need a remote pattern for no benefit here.
          <img
            className="review-card-photo"
            src={avatar.pictureUrl}
            alt=""
            referrerPolicy="no-referrer"
          />
        ) : null}
        <div className="review-card-id">
          <h2 className="review-card-name">{avatar.name}</h2>
          <p className="review-card-meta">
            {avatar.ownerEmail} ·{' '}
            <a href={`${WEB_BASE_URL}/${avatar.handle}`} target="_blank" rel="noreferrer">
              /{avatar.handle}
            </a>{' '}
            · {avatar.availability} ·{' '}
            {avatar.subject === 'project' ? 'something they run' : 'themselves'}
            {avatar.isHiddenFromSearch ? ' · hidden from search' : ''}
          </p>
        </div>
      </header>

      <dl className="review-card-fields">
        <ReviewField label="Bio" text={avatar.bio} />
        <ReviewField label="Ask me about" text={avatar.askMeAbout.join(' · ')} />
        <ReviewField label="Website" text={avatar.websiteUrl ?? ''} />
        <ReviewField label="About" text={avatar.aboutMe} />
        <ReviewField label="How they talk" text={avatar.speakingStyle} />
        <ReviewField label="Topics to avoid" text={avatar.avoidTopics} />
      </dl>

      <footer className="review-card-foot">
        <p className="review-card-meta">
          Launched {REVIEW_DATE_FORMAT.format(new Date(avatar.createdAt))}
          {avatar.listingReviewedAt !== null
            ? ` · reviewed ${REVIEW_DATE_FORMAT.format(new Date(avatar.listingReviewedAt))}`
            : ` · updated ${REVIEW_DATE_FORMAT.format(new Date(avatar.updatedAt))}`}
        </p>
        <form action={reviewAvatarAction} className="review-card-actions">
          <input type="hidden" name="avatarId" value={avatar.id} />
          {decisionsFor(avatar).map((decision) => (
            <button
              key={decision.listing}
              type="submit"
              name="listing"
              value={decision.listing}
              className={decision.isPrimary ? 'button-primary' : 'button-quiet'}
            >
              {decision.label}
            </button>
          ))}
        </form>
      </footer>
    </article>
  );
}

function ReviewField({ label, text }: { label: string; text: string }) {
  return (
    <>
      <dt className="review-card-label">{label}</dt>
      <dd className="review-card-text">{text === '' ? '—' : text}</dd>
    </>
  );
}
