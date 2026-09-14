'use client';

import { X } from 'lucide-react';
import { type ReactNode, useEffect } from 'react';

interface SettingsPanelProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function SettingsPanel({ title, onClose, children }: SettingsPanelProps) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: the scrim is a dismiss target, not a control — Escape and the close button are the accessible ways out, and making it a button would nest a dialog inside interactive content.
    // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard dismissal is the Escape handler above.
    <div
      className="settings-scrim"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="settings-panel" role="dialog" aria-modal="true" aria-label={title}>
        <div className="settings-head">
          <h2 className="settings-title">{title}</h2>
          <button
            type="button"
            className="settings-close"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
