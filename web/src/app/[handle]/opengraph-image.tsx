import { loadAvatarProfile } from '@/lib/avatar-profiles';
import { PRODUCT_NAME, PRODUCT_TAGLINE } from '@/lib/product';
import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  renderAvatarOgImage,
  renderSiteOgImage,
} from '@/lib/seo/og-image';

export const alt = 'Talk to my AI avatar';
export const size = OG_IMAGE_SIZE;
export const contentType = OG_IMAGE_CONTENT_TYPE;

export default async function AvatarOgImage(props: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await props.params;
  const avatar = await loadAvatarProfile(handle.toLowerCase());

  // A link to a handle that does not exist still unfurls to something true.
  return avatar === null
    ? renderSiteOgImage({ eyebrow: PRODUCT_NAME, title: PRODUCT_TAGLINE })
    : renderAvatarOgImage(avatar);
}
