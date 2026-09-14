'use client';

import { ConversationProvider } from '@/state/ConversationProvider';
import { SessionProvider } from '@/state/SessionProvider';
import { ChatCanvas } from './ChatCanvas';
import { ConsentCard } from './ConsentCard';
import { MobileHeader } from './MobileHeader';
import { ProfileMenu } from './ProfileMenu';

export function AppShell() {
  return (
    <SessionProvider>
      <ConversationProvider>
        <div className="shell">
          <MobileHeader />
          <ProfileMenu />
          <ChatCanvas />
          <ConsentCard />
        </div>
      </ConversationProvider>
    </SessionProvider>
  );
}
