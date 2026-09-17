import Link from 'next/link';
import { StatusPage } from '@/components/StatusPage';

export default function NotFoundPage() {
  return (
    <StatusPage
      title="Nothing lives here"
      message="This link may have a typo, or the avatar it pointed to is gone."
    >
      <Link href="/" className="status-page-action">
        See all avatars
      </Link>
    </StatusPage>
  );
}
