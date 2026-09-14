import { differenceInCalendarDays, format, isValid } from 'date-fns';

const WITHIN_THIS_WEEK_DAYS = 7;

export function formatDateDivider(at: string, now: number = Date.now()): string {
  const then = new Date(at);
  if (!isValid(then)) return '';

  const daysAgo = differenceInCalendarDays(now, then);
  if (daysAgo <= 0) return 'Today';
  if (daysAgo === 1) return 'Yesterday';
  if (daysAgo < WITHIN_THIS_WEEK_DAYS) return format(then, 'EEEE');
  return format(then, 'MMM d');
}

export function formatAbsoluteDate(at: string): string {
  const then = new Date(at);
  if (!isValid(then)) return '';
  return format(then, 'd MMM yyyy');
}
