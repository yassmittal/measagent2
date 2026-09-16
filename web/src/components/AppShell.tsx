'use client';

import type { AvatarProfile } from '@measagent/shared/avatars';
import { ConversationProvider } from '@/state/ConversationProvider';
import { ChatCanvas } from './ChatCanvas';
import { ConsentCard } from './ConsentCard';
import { MobileHeader } from './MobileHeader';
import { ProfileMenu } from './ProfileMenu';

interface AppShellProps {
  avatar: AvatarProfile;
  /** A question brought from the front page; empty when there is none. */
  initialDraft: string;
}

export function AppShell({ avatar, initialDraft }: AppShellProps) {
  return (
    <ConversationProvider avatar={avatar}>
      <div className="shell">
        <MobileHeader />
        <ProfileMenu />
        <ChatCanvas initialDraft={initialDraft} />
        <ConsentCard />
      </div>
    </ConversationProvider>
  );
}
