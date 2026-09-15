/**
 * Imported as `@measagent/shared/weekly-summary`: the category labels are
 * runtime values, read by the api for the email and by the web app for the
 * owner's visitors page.
 */

/**
 * Why a conversation is worth the owner's own attention. Decided by the model,
 * from this fixed list only — anything it returns outside it is dropped.
 */
export type AttentionCategory =
  | 'wants_to_reach_you'
  | 'business_enquiry'
  | 'deferred_to_you'
  | 'complaint'
  | 'safety_concern';

export const ATTENTION_CATEGORY_LABELS: Readonly<Record<AttentionCategory, string>> =
  Object.freeze({
    wants_to_reach_you: 'Wants to reach you',
    business_enquiry: 'Business enquiry',
    deferred_to_you: 'Waiting on you',
    complaint: 'Complaint',
    safety_concern: 'Possible safety concern',
  });

export interface AttentionFlag {
  category: AttentionCategory;
  /** One sentence saying what the visitor wants. Never a quote, never contact details. */
  reason: string;
}

export interface WeeklySummarySettings {
  isEnabled: boolean;
  /** IANA name. The email goes out Monday 09:00 here. */
  timeZone: string;
}

/** `GET` and `PATCH /v1/me/weekly-summary` */
export interface WeeklySummarySettingsResponse {
  settings: WeeklySummarySettings;
}

export type UpdateWeeklySummarySettingsRequest = Partial<WeeklySummarySettings>;
