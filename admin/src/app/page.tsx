import type { AvatarListing } from '@measagent/shared/avatars';
import { redirect } from 'next/navigation';
import { ListingTabs } from '@/components/ListingTabs';
import { ReviewCard } from '@/components/ReviewCard';
import { listAvatarsForReview } from '@/lib/admin-api';
import { readAdminSessionToken } from '@/lib/admin-session';
import { signOutAction } from './actions';

const LISTINGS: ReadonlyArray<AvatarListing> = ['listed', 'declined', 'pending'];

const EMPTY_LISTING_MESSAGES: Record<AvatarListing, string> = {
  listed: 'No avatar is listed yet.',
  declined: 'No avatar has been unlisted.',
  pending: 'Nothing is waiting. New avatars are listed straight away.',
};

export default async function ReviewPage(props: PageProps<'/'>) {
  const token = await readAdminSessionToken();
  if (token === null) redirect('/login');

  const requestedListing = (await props.searchParams).listing;
  const listing =
    LISTINGS.find((candidate) => candidate === requestedListing) ?? 'listed';

  const avatars = await listAvatarsForReview(token, listing);
  if (avatars === null) redirect('/login');

  return (
    <main className="review-page">
      <header className="review-head">
        <h1 className="review-title">Avatars</h1>
        <form action={signOutAction}>
          <button type="submit" className="button-quiet">
            Sign out
          </button>
        </form>
      </header>

      <ListingTabs activeListing={listing} />

      {avatars.length === 0 ? (
        <p className="review-empty">{EMPTY_LISTING_MESSAGES[listing]}</p>
      ) : (
        <ul className="review-list">
          {avatars.map((avatar) => (
            <li key={avatar.id}>
              <ReviewCard avatar={avatar} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
