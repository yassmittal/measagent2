'use client';

import { ConversationProvider } from '@/state/ConversationProvider';
import { ChatCanvas } from './ChatCanvas';
import { MobileHeader } from './MobileHeader';

export function AppShell() {
  return (
    <ConversationProvider>
      <div className="shell">
        <MobileHeader />
        <ChatCanvas />
      </div>
    </ConversationProvider>
  );
}
