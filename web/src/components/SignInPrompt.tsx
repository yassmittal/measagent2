'use client';

import Link from 'next/link';
import { useGoogleSignInButton } from '@/hooks/useGoogleSignInButton';
import { useSession } from '@/state/SessionProvider';
import { Skeleton } from './Skeleton';

interface SignInPromptProps {
  title: string;
  lede: string;
  onSignedIn: () => void;
}

export function SignInPrompt({ title, lede, onSignedIn }: SignInPromptProps) {
  const { signInWithGoogleCredential, signInError } = useSession();

  const { hostRef, isReady, error } = useGoogleSignInButton({
    onCredential: async (idToken) => {
      await signInWithGoogleCredential(idToken);
      onSignedIn();
    },
  });

  return (
    <div className="auth-screen">
      <h3 className="auth-title">{title}</h3>
      <p className="auth-lede">{lede}</p>

      {/* Google draws its button into the host once its script loads; the
          placeholder shares the host's cell so nothing moves when it does. */}
      <div className="auth-button-slot">
        {!isReady && error === null ? (
          <Skeleton width={240} height={40} shape="pill" />
        ) : null}
        <div className="auth-button-host" ref={hostRef} />
      </div>

      {error !== null ? <p className="auth-hint">{error}</p> : null}
      {signInError !== null ? <p className="auth-hint">{signInError}</p> : null}

      <p className="auth-legal">
        Signing in means agreeing to the <Link href="/terms">terms</Link> and the{' '}
        <Link href="/privacy">privacy notice</Link>.
      </p>
    </div>
  );
}
