import type { WeeklySummarySettings } from '@measagent/shared/weekly-summary';
import type { UserDoc } from '../../shared/documents.js';
import { isValidTimeZone } from './summary-week.js';

/**
 * On unless the owner turned it off, in UTC until their browser has told us
 * their zone. The one place a user document's partial settings are filled in.
 */
export function readWeeklySummarySettings(user: UserDoc): WeeklySummarySettings {
  const timeZone = user.weeklySummary?.timeZone;
  return {
    isEnabled: user.weeklySummary?.isEnabled ?? true,
    timeZone: timeZone !== undefined && isValidTimeZone(timeZone) ? timeZone : 'UTC',
  };
}
