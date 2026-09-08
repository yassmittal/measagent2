export function QueuedMessage({ text }: { text: string }) {
  return (
    <div className="msg-row msg-row-user">
      <div className="msg-row-queued-col">
        <div className="msg-user msg-user-queued" aria-live="polite">
          {text}
        </div>
        <span className="msg-queued-label">Queued</span>
      </div>
    </div>
  );
}
