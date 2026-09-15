import type { AvatarProfile } from '@measagent/shared/avatars';
import Link from 'next/link';
import { PRODUCT_NAME, PRODUCT_TAGLINE } from '@/lib/product';
import { AvatarCard } from './AvatarCard';

export function AvatarDirectory({ avatars }: { avatars: AvatarProfile[] }) {
  return (
    <main className="avatar-directory">
      <header className="avatar-directory-head">
        <h1 className="avatar-directory-title">{PRODUCT_NAME}</h1>
        <p className="avatar-directory-lede">{PRODUCT_TAGLINE}</p>
        <Link href="/launch" className="avatar-directory-launch">
          Launch your avatar
        </Link>
      </header>

      {avatars.length === 0 ? (
        <p className="avatar-directory-empty">
          No avatars are listed yet. Be the first to launch one.
        </p>
      ) : (
        <ul className="avatar-directory-grid">
          {avatars.map((avatar) => (
            <li key={avatar.id}>
              <AvatarCard avatar={avatar} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
