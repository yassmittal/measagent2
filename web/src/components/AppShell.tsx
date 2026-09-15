'use client';

import type { AvatarProfile } from '@measagent/shared/avatars';
import { ConversationProvider } from '@/state/ConversationProvider';
import { ChatCanvas } from './ChatCanvas';
import { ConsentCard } from './ConsentCard';
import { MobileHeader } from './MobileHeader';
import { ProfileMenu } from './ProfileMenu';

export function AppShell({ avatar }: { avatar: AvatarProfile }) {
  return (
    <ConversationProvider avatar={avatar}>
      <div className="shell">
        <MobileHeader />
        <ProfileMenu />
        <ChatCanvas />
        <ConsentCard />
      </div>
    </ConversationProvider>
  );
}
