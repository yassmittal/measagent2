import type { AvatarListing } from '@measagent/shared/avatars';
import Link from 'next/link';

const LISTING_LABELS: Record<AvatarListing, string> = {
  pending: 'Pending',
  listed: 'Listed',
  declined: 'Declined',
};

export function ListingTabs({ activeListing }: { activeListing: AvatarListing }) {
  return (
    <nav className="listing-tabs" aria-label="Listing">
      {(Object.keys(LISTING_LABELS) as AvatarListing[]).map((listing) => (
        <Link
          key={listing}
          href={{ pathname: '/', query: { listing } }}
          className="listing-tab"
          aria-current={listing === activeListing ? 'page' : undefined}
        >
          {LISTING_LABELS[listing]}
        </Link>
      ))}
    </nav>
  );
}
