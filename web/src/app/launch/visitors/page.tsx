import type { Metadata } from 'next';
import { ConsentCard } from '@/components/ConsentCard';
import { OwnerVisitors } from '@/components/OwnerVisitors';
import { ProfileMenu } from '@/components/ProfileMenu';

export const metadata: Metadata = {
  title: 'Your visitors',
  description: 'Who talks to your avatar, and what about.',
  robots: { index: false },
};

export default function OwnerVisitorsPage() {
  return (
    <div className="owner-visitors-page">
      <ProfileMenu />
      <OwnerVisitors />
      <ConsentCard />
    </div>
  );
}
