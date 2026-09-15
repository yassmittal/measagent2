import { ATTENTION_CATEGORY_LABELS, type AttentionFlag } from '@measagent/shared/weekly-summary';

/**
 * The weekly email itself, as plain text and as simple HTML. Everything in it
 * was written by the code or by the summary writer, never copied out of a
 * conversation, and every value is escaped before it goes into the HTML.
 */

export interface SummaryEmailVisitor {
  name: string;
  isNew: boolean;
  messageCount: number;
  summary: string;
  needsAttention: AttentionFlag | null;
  visitorUrl: string;
}

export interface SummaryEmailInput {
  ownerName: string;
  periodEnd: Date;
  timeZone: string;
  visitors: SummaryEmailVisitor[];
  totals: { visitorCount: number; newVisitorCount: number; messageCount: number };
  visitorsUrl: string;
  unsubscribeUrl: string;
}

export interface SummaryEmail {
  subject: string;
  text: string;
  html: string;
}

export function buildSummaryEmail(input: SummaryEmailInput): SummaryEmail {
  const flagged = input.visitors.filter((visitor) => visitor.needsAttention !== null);
  const uncoveredCount = input.totals.visitorCount - input.visitors.length;
  const weekLabel = `the week to ${new Intl.DateTimeFormat('en-GB', {
    timeZone: input.timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(input.periodEnd)}`;

  const subject =
    flagged.length > 0
      ? `Your avatar this week: ${plural(input.totals.visitorCount, 'visitor')}, ${flagged.length} need${flagged.length === 1 ? 's' : ''} you`
      : `Your avatar this week: ${plural(input.totals.visitorCount, 'visitor')}`;

  const totalsLine = `${plural(input.totals.visitorCount, 'person', 'people')} talked to your avatar in ${weekLabel} (${input.totals.newVisitorCount} new), sending ${plural(input.totals.messageCount, 'message')}.`;
  const describeVisitor = (visitor: SummaryEmailVisitor) =>
    `${visitor.isNew ? 'new' : 'returning'} · ${plural(visitor.messageCount, 'message')}`;
  const moreLine =
    uncoveredCount > 0 ? `And ${plural(uncoveredCount, 'more visitor')} — see them all.` : null;
  const footer = `You get this because you launched an avatar. The people who talk to it were told that you read their conversations. Treat what they said with care.`;

  const text = [
    `Hi ${input.ownerName},`,
    '',
    totalsLine,
    ...(flagged.length > 0
      ? [
          '',
          'NEEDS YOU',
          ...flagged.map(
            (visitor) =>
              `- ${visitor.name} — ${ATTENTION_CATEGORY_LABELS[visitor.needsAttention?.category ?? 'deferred_to_you']}: ${visitor.needsAttention?.reason}\n  ${visitor.visitorUrl}`
          ),
        ]
      : []),
    '',
    'WHO CAME',
    ...input.visitors.map(
      (visitor) =>
        `- ${visitor.name} (${describeVisitor(visitor)})\n  ${visitor.summary}\n  ${visitor.visitorUrl}`
    ),
    ...(moreLine !== null ? [moreLine] : []),
    '',
    `All your visitors: ${input.visitorsUrl}`,
    '',
    footer,
    `Stop these emails: ${input.unsubscribeUrl}`,
  ].join('\n');

  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;background:#fbfbfb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1f2430;">
<div style="max-width:560px;margin:0 auto;">
<p style="font-size:16px;line-height:1.5;margin:0 0 12px;">Hi ${escapeHtml(input.ownerName)},</p>
<p style="font-size:16px;line-height:1.5;margin:0 0 24px;">${escapeHtml(totalsLine)}</p>
${
  flagged.length > 0
    ? `<h2 style="font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#b4232a;margin:0 0 8px;">Needs you</h2>
${flagged
  .map(
    (visitor) => `<div style="padding:12px 16px;margin:0 0 8px;background:#fff;border:1px solid #f0c8ca;border-radius:12px;">
<p style="margin:0;font-size:15px;line-height:1.45;"><a href="${escapeHtml(visitor.visitorUrl)}" style="color:#1f2430;font-weight:600;">${escapeHtml(visitor.name)}</a> · ${escapeHtml(ATTENTION_CATEGORY_LABELS[visitor.needsAttention?.category ?? 'deferred_to_you'])}</p>
<p style="margin:4px 0 0;font-size:14px;line-height:1.45;color:#374151;">${escapeHtml(visitor.needsAttention?.reason ?? '')}</p>
</div>`
  )
  .join('\n')}
<div style="height:16px;"></div>`
    : ''
}
<h2 style="font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#6b7280;margin:0 0 8px;">Who came</h2>
${input.visitors
  .map(
    (visitor) => `<div style="padding:12px 16px;margin:0 0 8px;background:#fff;border:1px solid #e1e4e9;border-radius:12px;">
<p style="margin:0;font-size:15px;line-height:1.45;"><a href="${escapeHtml(visitor.visitorUrl)}" style="color:#1f2430;font-weight:600;">${escapeHtml(visitor.name)}</a> <span style="color:#9ca3af;font-size:13px;">${escapeHtml(describeVisitor(visitor))}</span></p>
<p style="margin:4px 0 0;font-size:14px;line-height:1.45;color:#374151;">${escapeHtml(visitor.summary)}</p>
</div>`
  )
  .join('\n')}
${moreLine !== null ? `<p style="font-size:14px;margin:8px 0 0;color:#6b7280;">${escapeHtml(moreLine)}</p>` : ''}
<p style="margin:24px 0;"><a href="${escapeHtml(input.visitorsUrl)}" style="display:inline-block;padding:10px 20px;border-radius:999px;background:#1877f2;color:#fff;text-decoration:none;font-size:15px;">See all your visitors</a></p>
<p style="font-size:12px;line-height:1.5;color:#9ca3af;margin:0;">${escapeHtml(footer)} <a href="${escapeHtml(input.unsubscribeUrl)}" style="color:#9ca3af;">Stop these emails</a>.</p>
</div>
</body></html>`;

  return { subject, text, html };
}

function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
