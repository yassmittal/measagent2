import type { Metadata } from 'next';
import { AvatarEditor } from '@/components/AvatarEditor';
import { ConsentCard } from '@/components/ConsentCard';
import { ProfileMenu } from '@/components/ProfileMenu';

export const metadata: Metadata = {
  title: 'Launch your avatar',
  description: 'Launch an AI avatar of yourself that anyone can talk to.',
};

export default function LaunchPage() {
  return (
    <div className="avatar-editor-page">
      <ProfileMenu />
      <AvatarEditor />
      <ConsentCard />
    </div>
  );
}
