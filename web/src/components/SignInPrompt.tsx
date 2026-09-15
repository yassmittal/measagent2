'use client';

import Link from 'next/link';
import { useGoogleSignInButton } from '@/hooks/useGoogleSignInButton';
import { useSession } from '@/state/SessionProvider';

interface SignInPromptProps {
  title: string;
  lede: string;
  onSignedIn: () => void;
}

export function SignInPrompt({ title, lede, onSignedIn }: SignInPromptProps) {
  const { signInWithGoogleCredential, signInError } = useSession();

  const { hostRef, error } = useGoogleSignInButton({
    onCredential: async (idToken) => {
      await signInWithGoogleCredential(idToken);
      onSignedIn();
    },
  });

  return (
    <div className="auth-screen">
      <h3 className="auth-title">{title}</h3>
      <p className="auth-lede">{lede}</p>

      <div className="auth-button-host" ref={hostRef} />

      {error !== null ? <p className="auth-hint">{error}</p> : null}
      {signInError !== null ? <p className="auth-hint">{signInError}</p> : null}

      <p className="auth-legal">
        Signing in means agreeing to the <Link href="/terms">terms</Link> and the{' '}
        <Link href="/privacy">privacy notice</Link>.
      </p>
    </div>
  );
}
