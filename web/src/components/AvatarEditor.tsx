'use client';

import type { OwnAvatar } from '@measagent/shared/avatars';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { loadOwnAvatar } from '@/lib/avatar-client';
import { useSession } from '@/state/SessionProvider';
import { AvatarForm } from './AvatarForm';
import { AvatarShareCard } from './AvatarShareCard';
import { SignInPrompt } from './SignInPrompt';

type OwnAvatarLoad =
  | { status: 'loading' }
  | { status: 'loaded'; avatar: OwnAvatar | null }
  | { status: 'failed' };

export function AvatarEditor() {
  const { status: sessionStatus, user } = useSession();
  const [ownAvatarLoad, setOwnAvatarLoad] = useState<OwnAvatarLoad>({
    status: 'loading',
  });

  const signedInUserId = user?.id ?? null;
  useEffect(() => {
    if (signedInUserId === null) return;

    let isMounted = true;
    setOwnAvatarLoad({ status: 'loading' });
    loadOwnAvatar()
      .then((avatar) => {
        if (isMounted) setOwnAvatarLoad({ status: 'loaded', avatar });
      })
      .catch(() => {
        if (isMounted) setOwnAvatarLoad({ status: 'failed' });
      });

    return () => {
      isMounted = false;
    };
  }, [signedInUserId]);

  const hasAvatar = ownAvatarLoad.status === 'loaded' && ownAvatarLoad.avatar !== null;

  return (
    <main className="avatar-editor">
      <Link href="/" className="avatar-editor-back">
        <ArrowLeft size={16} aria-hidden="true" />
        Back
      </Link>
      {sessionStatus === 'anonymous' ? (
        <SignInPrompt
          title="Launch your avatar"
          lede="An AI that talks as you, for anyone you share the link with. It takes its name and photo from the Google account you sign in with, so it can only ever be of you or of something you run."
          onSignedIn={() => {}}
        />
      ) : null}

      {user !== null ? (
        <>
          <h1 className="avatar-editor-title">
            {hasAvatar ? 'Your avatar' : 'Launch your avatar'}
          </h1>
          <p className="avatar-editor-lede">
            An AI that talks as you, for anyone you share the link with. You write what it
            knows about you; its name and photo come from your Google account.
          </p>
        </>
      ) : null}

      {user !== null && ownAvatarLoad.status === 'failed' ? (
        <p className="avatar-editor-error">
          Your avatar could not be loaded. Reload to try again.
        </p>
      ) : null}

      {user !== null && ownAvatarLoad.status === 'loaded' ? (
        <AvatarForm
          // Launching swaps the empty form for the edit form, and the edit form's
          // draft has to start from what was just saved.
          key={ownAvatarLoad.avatar?.id ?? 'new'}
          owner={user}
          avatar={ownAvatarLoad.avatar}
          onSaved={(avatar) => setOwnAvatarLoad({ status: 'loaded', avatar })}
        />
      ) : null}

      {user !== null &&
      ownAvatarLoad.status === 'loaded' &&
      ownAvatarLoad.avatar !== null ? (
        <AvatarShareCard avatar={ownAvatarLoad.avatar} />
      ) : null}
    </main>
  );
}
