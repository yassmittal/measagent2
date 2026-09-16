import type { Metadata } from 'next';
import Link from 'next/link';
import { AvatarEditor } from '@/components/AvatarEditor';
import { ConsentCard } from '@/components/ConsentCard';
import { ProfileMenu } from '@/components/ProfileMenu';
import { PRODUCT_PRICING_NOTE } from '@/lib/product';
import { buildPageMetadata } from '@/lib/seo/page-metadata';

export const metadata: Metadata = buildPageMetadata({
  path: '/launch',
  title: 'Launch your AI avatar',
  description:
    'Launch an AI avatar of yourself, or of something you run, that anyone can talk to by text or voice. Takes a few minutes. Free while in early access.',
});

export default function LaunchPage() {
  return (
    <div className="avatar-editor-page">
      <ProfileMenu />
      <AvatarEditor />
      {/* The editor waits for the session in the browser, so this is what the
          page says before it — and all a crawler reads. */}
      <section className="launch-explainer" aria-labelledby="launch-explainer-heading">
        <h2 id="launch-explainer-heading" className="launch-explainer-heading">
          What launching gives you
        </h2>
        <p className="launch-explainer-text">
          An AI that answers people as you at your own link, by text or voice. It
          remembers visitors who sign in, you read every conversation, and a weekly email
          tells you who needs you personally. {PRODUCT_PRICING_NOTE}{' '}
          <Link href="/how-it-works" className="launch-explainer-link">
            How it works
          </Link>
        </p>
      </section>
      <ConsentCard />
    </div>
  );
}
