'use client';

import type { UserProfile } from '@measagent/shared';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { forgetGoogleSession } from '@/hooks/useGoogleSignInButton';
import { forgetAllActiveChats } from '@/lib/active-chat';
import { readSessionToken, writeSessionToken } from '@/lib/auth/session-storage';
import { acceptConsent, loadSignedInUser, signInWithGoogle } from '@/lib/auth-client';

export type SessionStatus = 'loading' | 'anonymous' | 'signed-in';

interface SessionContextValue {
  status: SessionStatus;
  user: UserProfile | null;
  isSignedIn: boolean;
  identityKey: string | null;
  isConsentRequired: boolean;
  claimedThreadCount: number;
  signInError: string | null;
  signInWithGoogleCredential: (idToken: string) => Promise<void>;
  signOut: () => void;
  acceptCurrentTerms: () => Promise<void>;
  dismissClaimedThreads: () => void;
}

const ANONYMOUS_IDENTITY = 'anonymous';

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [claimedThreadCount, setClaimedThreadCount] = useState(0);
  const [signInError, setSignInError] = useState<string | null>(null);

  useEffect(() => {
    if (readSessionToken() === null) {
      setStatus('anonymous');
      return;
    }

    let isMounted = true;
    loadSignedInUser()
      .then((signedInUser) => {
        if (!isMounted) return;
        if (signedInUser === null) writeSessionToken(null);
        setUser(signedInUser);
        setStatus(signedInUser === null ? 'anonymous' : 'signed-in');
      })
      .catch(() => {
        // The api is unreachable, which is not the same as being signed out —
        // the token is kept so a reload once it is back finds the session.
        if (isMounted) setStatus('anonymous');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const signInWithGoogleCredential = useCallback(async (idToken: string) => {
    setSignInError(null);
    try {
      const result = await signInWithGoogle(idToken);
      writeSessionToken(result.sessionToken);
      setUser(result.user);
      setClaimedThreadCount(result.claimedThreadCount);
      setStatus('signed-in');
    } catch (error) {
      setSignInError(
        error instanceof Error ? error.message : 'That sign-in did not go through.',
      );
    }
  }, []);

  const signOut = useCallback(() => {
    writeSessionToken(null);
    forgetAllActiveChats();
    forgetGoogleSession();
    setUser(null);
    setClaimedThreadCount(0);
    setStatus('anonymous');
  }, []);

  const acceptCurrentTerms = useCallback(async () => {
    const { consentAcceptedAt } = await acceptConsent();
    setUser((current) =>
      current === null ? current : { ...current, consentAcceptedAt },
    );
  }, []);

  const dismissClaimedThreads = useCallback(() => setClaimedThreadCount(0), []);

  const value = useMemo<SessionContextValue>(
    () => ({
      status,
      user,
      isSignedIn: status === 'signed-in',
      identityKey: status === 'loading' ? null : (user?.id ?? ANONYMOUS_IDENTITY),
      isConsentRequired: status === 'signed-in' && user?.consentAcceptedAt === null,
      claimedThreadCount,
      signInError,
      signInWithGoogleCredential,
      signOut,
      acceptCurrentTerms,
      dismissClaimedThreads,
    }),
    [
      status,
      user,
      claimedThreadCount,
      signInError,
      signInWithGoogleCredential,
      signOut,
      acceptCurrentTerms,
      dismissClaimedThreads,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (value === null) {
    throw new Error('useSession must be used inside a SessionProvider');
  }
  return value;
}
