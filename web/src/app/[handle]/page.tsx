import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { StatusPage } from '@/components/StatusPage';
import { StructuredData } from '@/components/StructuredData';
import { ASK_DRAFT_PARAM, readAskDraft } from '@/lib/ask-draft';
import { loadAvatarProfile } from '@/lib/avatar-profiles';
import {
  buildAvatarPageDescription,
  buildAvatarPageTitle,
  shouldIndexAvatarPage,
} from '@/lib/seo/avatar-search';
import { buildPageMetadata } from '@/lib/seo/page-metadata';
import {
  buildAvatarProfilePageNode,
  buildBreadcrumbListNode,
} from '@/lib/seo/structured-data';

export async function generateMetadata(props: PageProps<'/[handle]'>): Promise<Metadata> {
  const { handle } = await props.params;
  const avatar = await loadAvatarProfile(handle);
  if (avatar === null) return {};

  // Pending, declined, paused, hidden by the owner or too thin: the page still
  // works at its link, but search engines are asked to leave it out.
  return buildPageMetadata({
    path: `/${avatar.handle}`,
    title: buildAvatarPageTitle(avatar),
    description: buildAvatarPageDescription(avatar),
    openGraphType: 'profile',
    isIndexable: shouldIndexAvatarPage(avatar),
  });
}

export default async function AvatarPage(props: PageProps<'/[handle]'>) {
  const { handle } = await props.params;

  // Handles are lowercase, but people type links from memory. One canonical
  // URL per avatar, so `/YashMittal` is a permanent redirect rather than a 404.
  const lowercaseHandle = handle.toLowerCase();
  if (handle !== lowercaseHandle) permanentRedirect(`/${lowercaseHandle}`);

  const avatar = await loadAvatarProfile(handle);
  if (avatar === null) notFound();

  // Paused is a choice the owner made, so the page says so instead of
  // pretending the handle does not exist — and does not open a conversation
  // the api would refuse on the first message.
  if (avatar.availability === 'paused') {
    return (
      <StatusPage
        title={`${avatar.name} has paused their avatar`}
        message="It can't chat right now. The other avatars can."
      >
        <Link href="/" className="status-page-action">
          See other avatars
        </Link>
      </StatusPage>
    );
  }

  const initialDraft = readAskDraft((await props.searchParams)[ASK_DRAFT_PARAM]);

  return (
    <>
      <AppShell avatar={avatar} initialDraft={initialDraft} />
      <StructuredData
        nodes={[
          buildAvatarProfilePageNode(avatar),
          buildBreadcrumbListNode([
            { name: 'Avatars', path: '/' },
            { name: avatar.name, path: `/${avatar.handle}` },
          ]),
        ]}
      />
    </>
  );
}
