import type { Metadata } from 'next';
import { AvatarDirectory } from '@/components/AvatarDirectory';
import { ConsentCard } from '@/components/ConsentCard';
import { ProfileMenu } from '@/components/ProfileMenu';
import { SiteFooter } from '@/components/SiteFooter';
import { StructuredData } from '@/components/StructuredData';
import { loadAvatarDirectory } from '@/lib/avatar-profiles';
import { PRODUCT_NAME } from '@/lib/product';
import { buildPageMetadata } from '@/lib/seo/page-metadata';
import { buildWebApplicationNode } from '@/lib/seo/structured-data';

const HOME_TITLE = `${PRODUCT_NAME} — Talk to AI avatars of real people`;

export const metadata: Metadata = buildPageMetadata({
  path: '/',
  // The brand leads here, so the layout's "— meAsAgent" template would repeat it.
  title: HOME_TITLE,
  isTitleAbsolute: true,
  description:
    'Talk to AI avatars of real people and the things they build, by text or voice — or launch your own in minutes. Free while in early access.',
});

export default async function DirectoryPage() {
  const avatars = await loadAvatarDirectory();

  return (
    <div className="avatar-directory-page">
      <ProfileMenu />
      <AvatarDirectory avatars={avatars} />
      <SiteFooter />
      <ConsentCard />
      <StructuredData nodes={[buildWebApplicationNode()]} />
    </div>
  );
}
