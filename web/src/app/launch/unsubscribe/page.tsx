import type { Metadata } from 'next';
import { WeeklySummaryUnsubscribe } from '@/components/WeeklySummaryUnsubscribe';

export const metadata: Metadata = {
  title: 'Weekly summary emails',
  robots: { index: false },
};

export default async function WeeklySummaryUnsubscribePage(
  props: PageProps<'/launch/unsubscribe'>,
) {
  const { token } = await props.searchParams;

  return (
    <div className="owner-visitors-page">
      <WeeklySummaryUnsubscribe token={typeof token === 'string' ? token : null} />
    </div>
  );
}
