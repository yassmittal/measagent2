import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { loadAvatarProfile } from '@/lib/avatar-profiles';

export async function generateMetadata(props: PageProps<'/[handle]'>): Promise<Metadata> {
  const { handle } = await props.params;
  const avatar = await loadAvatarProfile(handle);
  if (avatar === null) return {};

  const title = `Talk to ${avatar.name}`;
  return {
    title,
    description: avatar.bio,
    openGraph: { title, description: avatar.bio, url: `/${avatar.handle}` },
    twitter: { title, description: avatar.bio },
  };
}

export default async function AvatarPage(props: PageProps<'/[handle]'>) {
  const { handle } = await props.params;
  const avatar = await loadAvatarProfile(handle);
  if (avatar === null) notFound();

  // Paused is a choice the owner made, so the page says so instead of
  // pretending the handle does not exist — and does not open a conversation
  // the api would refuse on the first message.
  if (avatar.availability === 'paused') {
    return (
      <main className="page-centered">
        <p className="page-quiet">
          {avatar.name} has paused their avatar. <Link href="/">See other avatars</Link>
        </p>
      </main>
    );
  }

  return <AppShell avatar={avatar} />;
}
