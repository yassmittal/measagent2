import type { ThreadMessage } from '@measagent/shared';

interface MessageRowProps {
  message: ThreadMessage;
  entering: boolean;
}

export function MessageRow({ message, entering }: MessageRowProps) {
  const enteringClass = entering ? ' is-entering' : '';

  if (message.role === 'user') {
    return (
      <div
        className={`msg-row msg-row-user${enteringClass}`}
        data-message-id={message.id}
      >
        <div className="msg-user">{message.text}</div>
      </div>
    );
  }

  if (message.status === 'resolving') {
    return (
      <div className={`msg-andrew msg-resolving${enteringClass}`} data-status="resolving">
        <span>That reply did not finish sending.</span>
      </div>
    );
  }

  return (
    <div
      className={`msg-row msg-row-andrew${enteringClass}`}
      data-message-id={message.id}
    >
      <div className="msg-andrew-col">
        <div className="msg-andrew" data-status={message.status}>
          {message.isReturnReminder ? (
            <p className="msg-return-reminder-tag">While you were away</p>
          ) : null}
          <MessageText text={message.text} />
          {message.status === 'interrupted' ? (
            <p className="msg-interrupted-tag">The reply got cut off here.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MessageText({ text }: { text: string }) {
  const paragraphs = text.split(/\n{2,}/).filter((paragraph) => paragraph.trim() !== '');

  return (
    <>
      {paragraphs.map((paragraph, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: paragraphs come from splitting one immutable string, so none is ever moved, inserted or removed.
        <p key={index}>{paragraph}</p>
      ))}
    </>
  );
}
