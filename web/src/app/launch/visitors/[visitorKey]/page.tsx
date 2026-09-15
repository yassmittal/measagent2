import type { Metadata } from 'next';
import { ConsentCard } from '@/components/ConsentCard';
import { OwnerVisitorConversations } from '@/components/OwnerVisitorConversations';
import { ProfileMenu } from '@/components/ProfileMenu';

export const metadata: Metadata = {
  title: 'Your visitor',
  robots: { index: false },
};

export default async function OwnerVisitorPage(
  props: PageProps<'/launch/visitors/[visitorKey]'>,
) {
  const { visitorKey } = await props.params;

  return (
    <div className="owner-visitors-page">
      <ProfileMenu />
      <OwnerVisitorConversations visitorKey={visitorKey} />
      <ConsentCard />
    </div>
  );
}
