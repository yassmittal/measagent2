import { AvatarDirectory } from '@/components/AvatarDirectory';
import { ConsentCard } from '@/components/ConsentCard';
import { ProfileMenu } from '@/components/ProfileMenu';
import { loadAvatarDirectory } from '@/lib/avatar-profiles';

export default async function DirectoryPage() {
  const avatars = await loadAvatarDirectory();

  return (
    <div className="avatar-directory-page">
      <ProfileMenu />
      <AvatarDirectory avatars={avatars} />
      <ConsentCard />
    </div>
  );
}
