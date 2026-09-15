'use client';

import type { WeeklySummarySettings as Settings } from '@measagent/shared/weekly-summary';
import { useEffect, useState } from 'react';
import {
  loadWeeklySummarySettings,
  updateWeeklySummarySettings,
} from '@/lib/weekly-summary-client';

/** The owner's weekly email switch, on the visitors page. */
export function WeeklySummarySettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isSaving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    loadWeeklySummarySettings()
      .then(async (loaded) => {
        // Monday 09:00 means the owner's Monday, and this page is where the
        // service learns which zone that is.
        const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const current =
          browserTimeZone !== '' && browserTimeZone !== loaded.timeZone
            ? await updateWeeklySummarySettings({ timeZone: browserTimeZone }).catch(
                () => loaded,
              )
            : loaded;
        if (isMounted) setSettings(current);
      })
      .catch(() => {
        if (isMounted) setError('Your email settings could not be loaded.');
      });
    return () => {
      isMounted = false;
    };
  }, []);

  if (settings === null) {
    return error !== null ? (
      <p className="weekly-summary-settings-note">{error}</p>
    ) : null;
  }

  const toggle = async () => {
    setSaving(true);
    setError(null);
    try {
      setSettings(await updateWeeklySummarySettings({ isEnabled: !settings.isEnabled }));
    } catch {
      setError('That did not save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="weekly-summary-settings" aria-label="Weekly email">
      <label className="weekly-summary-settings-toggle">
        <input
          type="checkbox"
          checked={settings.isEnabled}
          onChange={toggle}
          disabled={isSaving}
        />
        <span>Email me a summary every Monday at 9:00</span>
      </label>
      <p className="weekly-summary-settings-note">
        Who talked to your avatar that week, what about, and anyone who needs you
        personally. Sent in {describeTimeZone(settings.timeZone)}.
      </p>
      {error !== null ? <p className="owner-visitors-error">{error}</p> : null}
    </section>
  );
}

/** "India Standard Time" rather than the zone id, which browsers may report by a legacy name. */
function describeTimeZone(timeZone: string): string {
  const name = new Intl.DateTimeFormat('en-GB', { timeZone, timeZoneName: 'long' })
    .formatToParts(new Date())
    .find((part) => part.type === 'timeZoneName')?.value;
  return name ?? timeZone.replace(/_/g, ' ');
}
