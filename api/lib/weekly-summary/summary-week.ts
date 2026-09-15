import { WEEKLY_SUMMARY_SEND_HOUR } from '../../shared/constants.js';

/**
 * Which week an owner's email covers, in the owner's own time zone: from one
 * Monday at 09:00 local to the next, the second being when it is sent. Done
 * with `Intl` rather than a time zone library, because it is the only
 * calculation of its kind here and the runtime already carries the zone data.
 */

export interface SummaryWeek {
  /** The owner's local date of the Monday the email goes out, `YYYY-MM-DD`. */
  weekKey: string;
  periodStart: Date;
  periodEnd: Date;
}

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** The most recent week whose email is already due at `now`. */
export function findLatestSummaryWeek(now: Date, timeZone: string): SummaryWeek {
  const local = readZonedParts(now, timeZone);
  const daysSinceMonday = WEEKDAYS.indexOf(local.weekday);
  // Calendar arithmetic on the local date, done in UTC so no zone interferes.
  let sendDate = new Date(Date.UTC(local.year, local.month - 1, local.day) - daysSinceMonday * MILLISECONDS_PER_DAY);
  let periodEnd = toZonedSendTime(sendDate, timeZone);
  if (periodEnd.getTime() > now.getTime()) {
    sendDate = new Date(sendDate.getTime() - 7 * MILLISECONDS_PER_DAY);
    periodEnd = toZonedSendTime(sendDate, timeZone);
  }
  // Computed from its own date rather than as `periodEnd - 7 days`, so a week
  // that crosses a daylight-saving change still starts at 09:00 local.
  const periodStart = toZonedSendTime(new Date(sendDate.getTime() - 7 * MILLISECONDS_PER_DAY), timeZone);

  return { weekKey: sendDate.toISOString().slice(0, 10), periodStart, periodEnd };
}

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: string;
}

function readZonedParts(at: Date, timeZone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    weekday: 'short',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(at);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';

  return {
    year: Number(read('year')),
    month: Number(read('month')),
    day: Number(read('day')),
    hour: Number(read('hour')),
    minute: Number(read('minute')),
    second: Number(read('second')),
    weekday: read('weekday'),
  };
}

/** 09:00 on `localDate` (a UTC midnight standing for a local date) in `timeZone`, as an instant. */
function toZonedSendTime(localDate: Date, timeZone: string): Date {
  const wallClock = localDate.getTime() + WEEKLY_SUMMARY_SEND_HOUR * 60 * 60 * 1000;
  // The offset depends on the instant, and the instant on the offset; a second
  // pass settles it for any zone that does not change offset within hours of 09:00.
  const firstGuess = wallClock - readZoneOffset(new Date(wallClock), timeZone);
  return new Date(wallClock - readZoneOffset(new Date(firstGuess), timeZone));
}

function readZoneOffset(at: Date, timeZone: string): number {
  const local = readZonedParts(at, timeZone);
  const asUtc = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, local.second);
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}
