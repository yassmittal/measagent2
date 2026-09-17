import { LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';

interface BusyButtonLabelProps {
  isBusy: boolean;
  children: ReactNode;
}

/** A button's text with a spinner beside it while its action runs. */
export function BusyButtonLabel({ isBusy, children }: BusyButtonLabelProps) {
  return (
    <span className="busy-button-label">
      {isBusy ? <LoaderCircle className="spinner" size={16} aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
