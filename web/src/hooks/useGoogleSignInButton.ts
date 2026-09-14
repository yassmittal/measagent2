'use client';

import { useEffect, useRef, useState } from 'react';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';
const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

interface GoogleIdentityServices {
  accounts: {
    id: {
      initialize(options: {
        client_id: string;
        callback: (response: { credential?: string }) => void;
      }): void;
      renderButton(
        parent: HTMLElement,
        options: {
          type: 'standard';
          theme: 'outline';
          size: 'large';
          text: 'continue_with';
          shape: 'pill';
        },
      ): void;
      disableAutoSelect(): void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityServices;
  }
}

let scriptLoad: Promise<void> | null = null;

function loadGoogleIdentityScript(): Promise<void> {
  scriptLoad ??= new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GOOGLE_SCRIPT_SRC}"]`,
    );
    if (existing !== null) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('script failed')));
      return;
    }

    const script = document.createElement('script');
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('script failed'));
    document.head.append(script);
  });

  return scriptLoad;
}

/** True when this deployment has a client id at all, so callers can say so. */
export const isGoogleSignInConfigured = GOOGLE_CLIENT_ID !== '';

interface UseGoogleSignInButtonOptions {
  onCredential: (idToken: string) => void;
}

export interface GoogleSignInButton {
  /** Attach to the element the button should be drawn inside. */
  hostRef: React.RefObject<HTMLDivElement | null>;
  isReady: boolean;
  error: string | null;
}

export function useGoogleSignInButton({
  onCredential,
}: UseGoogleSignInButtonOptions): GoogleSignInButton {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [isReady, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read inside Google's callback, which is registered once and would otherwise
  // keep calling the handler this hook was first rendered with.
  const onCredentialRef = useRef(onCredential);
  onCredentialRef.current = onCredential;

  useEffect(() => {
    if (!isGoogleSignInConfigured) {
      setError('Sign-in is not switched on yet.');
      return;
    }

    let isMounted = true;

    loadGoogleIdentityScript()
      .then(() => {
        const host = hostRef.current;
        const identity = window.google?.accounts.id;
        if (!isMounted || host === null || identity === undefined) return;

        identity.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: ({ credential }) => {
            if (credential !== undefined) onCredentialRef.current(credential);
          },
        });
        identity.renderButton(host, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
        });
        setReady(true);
      })
      .catch(() => {
        if (isMounted) setError('Google sign-in could not load.');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { hostRef, isReady, error };
}

/** Stops Google signing someone straight back in after they sign out. */
export function forgetGoogleSession(): void {
  window.google?.accounts.id.disableAutoSelect();
}
