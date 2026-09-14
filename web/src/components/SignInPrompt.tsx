'use client';

import Link from 'next/link';
import { useGoogleSignInButton } from '@/hooks/useGoogleSignInButton';
import { PERSONA_NAME } from '@/lib/persona';
import { useSession } from '@/state/SessionProvider';

export function SignInPrompt({ onSignedIn }: { onSignedIn: () => void }) {
  const { signInWithGoogleCredential, signInError } = useSession();

  const { hostRef, error } = useGoogleSignInButton({
    onCredential: async (idToken) => {
      await signInWithGoogleCredential(idToken);
      onSignedIn();
    },
  });

  return (
    <div className="auth-screen">
      <h3 className="auth-title">Keep this conversation</h3>
      <p className="auth-lede">
        Sign in and everything you have said to {PERSONA_NAME} follows you to your other
        devices. This conversation comes with you.
      </p>

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
