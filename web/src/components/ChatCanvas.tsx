'use client';

import { useCallback, useState } from 'react';
import { useConversation } from '@/state/ConversationProvider';
import { AvatarPanel } from './AvatarPanel';
import { ConversationThread } from './ConversationThread';
import { MessageComposer } from './MessageComposer';

export function ChatCanvas() {
  const { messages, turn, isLoading } = useConversation();
  const [composerHeight, setComposerHeight] = useState<number | null>(null);

  const onHeightChange = useCallback((height: number) => {
    if (height <= 0) return;
    setComposerHeight((current) => (current === height ? current : height));
  }, []);

  const paneStyle =
    composerHeight === null
      ? undefined
      : ({ '--composer-stack-height': `${composerHeight}px` } as React.CSSProperties);

  return (
    <div className="chat-canvas">
      <AvatarPanel />
      <main className="thread-pane" style={paneStyle}>
        <ConversationThread messages={messages} turn={turn} isLoading={isLoading} />
        <MessageComposer onHeightChange={onHeightChange} />
      </main>
    </div>
  );
}
