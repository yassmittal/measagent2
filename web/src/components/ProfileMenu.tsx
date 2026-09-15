'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useSession } from '@/state/SessionProvider';
import { AccountSettings } from './AccountSettings';
import { SettingsPanel } from './SettingsPanel';
import { SignInPrompt } from './SignInPrompt';

export function ProfileMenu() {
  const { status, user, signOut } = useSession();
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isPanelOpen, setPanelOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isMenuOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (profileRef.current?.contains(event.target as Node) === false) {
        setMenuOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isMenuOpen]);

  // Nothing is drawn until the api has said who this is: a control that showed
  // "sign in" and then flipped to a photo is worse than one that arrives late.
  if (status === 'loading') return null;

  const openSettings = () => {
    setMenuOpen(false);
    setPanelOpen(true);
  };

  return (
    <>
      <div className="profile" ref={profileRef}>
        <button
          type="button"
          className="profile-button"
          aria-label={user === null ? 'Sign in' : 'Account'}
          aria-expanded={isMenuOpen}
          onClick={() =>
            user === null ? setPanelOpen(true) : setMenuOpen((open) => !open)
          }
        >
          {user?.pictureUrl != null ? (
            // biome-ignore lint/performance/noImgElement: a 36px avatar served by Google's CDN — next/image would need a remote pattern for it and would add a wrapper element inside the rule that sizes this button.
            <img src={user.pictureUrl} alt="" referrerPolicy="no-referrer" />
          ) : (
            <span className="profile-initial">{initialOf(user?.name)}</span>
          )}
        </button>

        {isMenuOpen && user !== null ? (
          <div className="profile-menu" role="menu">
            <div className="profile-menu-id">
              <span className="profile-menu-name">{user.name}</span>
              <span className="profile-menu-email">{user.email}</span>
            </div>
            <div className="profile-menu-divider" />
            <Link
              href="/launch"
              className="profile-menu-item"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
            >
              Your avatar
            </Link>
            <button
              type="button"
              className="profile-menu-item"
              role="menuitem"
              onClick={openSettings}
            >
              Settings
            </button>
            <button
              type="button"
              className="profile-menu-item"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                signOut();
              }}
            >
              Sign out
            </button>
          </div>
        ) : null}
      </div>

      {isPanelOpen ? (
        <SettingsPanel
          title={user === null ? 'Sign in' : 'Settings'}
          onClose={() => setPanelOpen(false)}
        >
          {user === null ? (
            <SignInPrompt
              title="Sign in"
              lede="Sign in and your conversations follow you to your other devices, and you can launch an avatar of your own."
              onSignedIn={() => setPanelOpen(false)}
            />
          ) : (
            <AccountSettings
              user={user}
              onSignOut={() => {
                setPanelOpen(false);
                signOut();
              }}
            />
          )}
        </SettingsPanel>
      ) : null}
    </>
  );
}

const initialOf = (name: string | undefined): string =>
  name === undefined || name === '' ? '?' : name.trim().charAt(0).toUpperCase();
