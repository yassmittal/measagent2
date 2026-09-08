export function formatDateDivider(at: string, now: number = Date.now()): string {
  const then = new Date(at);
  if (Number.isNaN(then.getTime())) return '';

  const startOfDay = (date: Date): number =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

  const daysAgo = Math.round((startOfDay(new Date(now)) - startOfDay(then)) / 86_400_000);

  if (daysAgo <= 0) return 'Today';
  if (daysAgo === 1) return 'Yesterday';
  if (daysAgo < 7) return then.toLocaleDateString(undefined, { weekday: 'long' });
  return then.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
