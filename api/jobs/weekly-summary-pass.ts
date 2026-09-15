import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { FastifyBaseLogger } from 'fastify';
import type { Db } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { hasAcceptedTerms } from '../lib/auth/user-profile.js';
import { findAvatarsWithOwners } from '../lib/avatars/avatar-with-owner.js';
import { readMessageText } from '../lib/chat/reply-runner.js';
import { selectTranscriptWindow } from '../lib/memory/memory-writer.js';
import { findAvatarVisitors } from '../lib/visitors/avatar-visitors.js';
import { buildSummaryEmail } from '../lib/weekly-summary/summary-email.js';
import { findLatestSummaryWeek } from '../lib/weekly-summary/summary-week.js';
import {
  buildVisitorWeekPrompt,
  parseVisitorWeekOutput,
} from '../lib/weekly-summary/visitor-week-writer.js';
import { readWeeklySummarySettings } from '../lib/weekly-summary/weekly-summary-settings.js';
import { EmailDeliveryError, type EmailSettings, sendEmail } from '../services/email.js';
import { buildChatModel } from '../services/language-model.js';
import {
  avatarsCollection,
  messagesCollection,
  usersCollection,
  weeklySummariesCollection,
} from '../shared/collections.js';
import {
  BACKGROUND_BATCH_SIZE,
  BACKGROUND_LEASE_SECONDS,
  MEMORY_MODEL,
  WEEKLY_SUMMARY_MAX_TOKENS,
  WEEKLY_SUMMARY_OPEN_WINDOW_HOURS,
  WEEKLY_SUMMARY_RETRY_MINUTES,
  WEEKLY_SUMMARY_VISITOR_LIMIT,
} from '../shared/constants.js';
import type { AvatarDoc, UserDoc, WeeklySummaryDoc, WeeklySummaryVisitor } from '../shared/documents.js';
import { getErrorMessage, getErrorProperty } from '../shared/errors.js';
import { secondsFromNow } from './relationship-lease.js';

/**
 * The owner's weekly email, from "this week is due" to "sent", one step per
 * claim of a lease:
 *
 *   open         a summary document per owner per week, once it is due
 *   summarizing  read the week, then one model call per visitor, each stored as it lands
 *   sending      render and send; the document id is the provider's idempotency key
 *
 * Every step can fail and be retried without repeating finished work: a
 * summarised visitor is not summarised again, and an email the provider already
 * accepted is not sent again. None of it runs unless an email provider is
 * configured, and none of it touches a conversation, a memory or a reminder.
 */

export interface WeeklySummaryJobContext {
  db: Db;
  log: FastifyBaseLogger;
  email: EmailSettings;
  webBaseUrl: string;
  apiPublicUrl: string;
  signUnsubscribeToken: (ownerId: string) => string;
}

const MONGO_DUPLICATE_KEY = 11000;
const HOUR_MS = 60 * 60 * 1000;
/** Messages read per visitor before the transcript window trims them. */
const WEEK_MESSAGE_LIMIT = 200;

export async function runWeeklySummaryPass(context: WeeklySummaryJobContext): Promise<void> {
  await openDueWeeklySummaries(context);

  for (let handled = 0; handled < BACKGROUND_BATCH_SIZE; handled += 1) {
    const summary = await claimDueWeeklySummary(context.db);
    if (summary === null) return;

    try {
      await advanceWeeklySummary(context, summary);
    } catch (error) {
      await recordFailedAttempt(context, summary._id, error);
    } finally {
      await weeklySummariesCollection(context.db).updateOne(
        { _id: summary._id },
        { $set: { leaseUntil: null } }
      );
    }
  }
}

async function openDueWeeklySummaries({ db }: WeeklySummaryJobContext): Promise<void> {
  const now = new Date();
  const avatarsWithOwners = await findAvatarsWithOwners(db, {}, { createdAt: 1 });

  for (const { avatar, owner } of avatarsWithOwners) {
    const settings = readWeeklySummarySettings(owner);
    if (!settings.isEnabled || !hasAcceptedTerms(owner)) continue;

    const week = findLatestSummaryWeek(now, settings.timeZone);
    if (now.getTime() - week.periodEnd.getTime() > WEEKLY_SUMMARY_OPEN_WINDOW_HOURS * HOUR_MS) {
      continue;
    }

    // Keyed on the local Monday, so an owner who moves across the date line
    // mid-window could otherwise land on a second key for the same week.
    const recent = await weeklySummariesCollection(db).findOne({
      ownerId: owner._id,
      periodEnd: { $gt: new Date(week.periodEnd.getTime() - 6 * 24 * HOUR_MS) },
    });
    if (recent !== null) continue;

    try {
      await weeklySummariesCollection(db).insertOne({
        _id: uuidv4(),
        ownerId: owner._id,
        avatarId: avatar._id,
        weekKey: week.weekKey,
        periodStart: week.periodStart,
        periodEnd: week.periodEnd,
        status: 'summarizing',
        visitors: null,
        totals: null,
        attentionFlags: [],
        attempts: 0,
        nextAttemptAt: now,
        leaseUntil: null,
        lastError: null,
        sentAt: null,
        createdAt: now,
        updatedAt: now,
      });
    } catch (error) {
      // Another instance opened the same week first, which is the state wanted.
      if (getErrorProperty(error, 'code') !== MONGO_DUPLICATE_KEY) throw error;
    }
  }
}

async function claimDueWeeklySummary(db: Db): Promise<WeeklySummaryDoc | null> {
  const now = new Date();
  return weeklySummariesCollection(db).findOneAndUpdate(
    {
      status: { $in: ['summarizing', 'sending'] },
      nextAttemptAt: { $lte: now },
      $or: [{ leaseUntil: null }, { leaseUntil: { $lte: now } }],
    },
    { $set: { leaseUntil: secondsFromNow(BACKGROUND_LEASE_SECONDS) } },
    { sort: { nextAttemptAt: 1 }, returnDocument: 'after' }
  );
}

async function advanceWeeklySummary(
  context: WeeklySummaryJobContext,
  claimed: WeeklySummaryDoc
): Promise<void> {
  const { db } = context;
  const [owner, avatar] = await Promise.all([
    usersCollection(db).findOne({ _id: claimed.ownerId }),
    avatarsCollection(db).findOne({ _id: claimed.avatarId, ownerId: claimed.ownerId }),
  ]);
  // Checked again at every step, so turning the email off stops one that is
  // already being written.
  if (
    owner === null ||
    avatar === null ||
    !hasAcceptedTerms(owner) ||
    !readWeeklySummarySettings(owner).isEnabled
  ) {
    await finishWeeklySummary(db, claimed._id, 'skipped', 'The owner turned the weekly summary off');
    return;
  }

  let summary = claimed;
  if (summary.status === 'summarizing') {
    if (summary.visitors === null) {
      const read = await readWeek(db, summary, avatar);
      if (read === null) return;
      summary = read;
    }
    await summarizeVisitors(db, summary, avatar, owner);
    await weeklySummariesCollection(db).updateOne(
      { _id: summary._id },
      {
        $set: {
          status: 'sending',
          attempts: 0,
          nextAttemptAt: new Date(),
          lastError: null,
          updatedAt: new Date(),
        },
      }
    );
  }

  const ready = await weeklySummariesCollection(db).findOne({ _id: summary._id });
  if (ready?.status === 'sending') await sendWeeklySummary(context, ready, owner);
}

/** Who talked to the avatar during the week, busiest first. Null when nobody did. */
async function readWeek(
  db: Db,
  summary: WeeklySummaryDoc,
  avatar: AvatarDoc
): Promise<WeeklySummaryDoc | null> {
  const { visitors } = await findAvatarVisitors(db, avatar);
  const threadIds = visitors.flatMap(({ threads }) => threads.map((thread) => thread._id));
  const countsByThread = await messagesCollection(db)
    .aggregate<{ _id: string; count: number }>([
      {
        $match: {
          threadId: { $in: threadIds },
          role: 'user',
          createdAt: { $gte: summary.periodStart, $lt: summary.periodEnd },
        },
      },
      { $group: { _id: '$threadId', count: { $sum: 1 } } },
    ])
    .toArray();
  const weekCounts = new Map(countsByThread.map(({ _id, count }) => [_id, count]));

  const weekVisitors = visitors
    .map(({ visitor, threads }): WeeklySummaryVisitor => {
      const activeThreads = threads.filter((thread) => weekCounts.has(thread._id));
      return {
        key: visitor.key,
        name: visitor.name,
        isNew: new Date(visitor.firstSeenAt) >= summary.periodStart,
        conversationCount: activeThreads.length,
        messageCount: activeThreads.reduce((total, thread) => total + (weekCounts.get(thread._id) ?? 0), 0),
        summary: null,
        needsAttention: null,
      };
    })
    .filter((visitor) => visitor.messageCount > 0)
    .sort((a, b) => b.messageCount - a.messageCount);

  if (weekVisitors.length === 0) {
    await finishWeeklySummary(db, summary._id, 'skipped', 'Nobody talked to the avatar that week');
    return null;
  }

  const totals = {
    visitorCount: weekVisitors.length,
    newVisitorCount: weekVisitors.filter((visitor) => visitor.isNew).length,
    messageCount: weekVisitors.reduce((total, visitor) => total + visitor.messageCount, 0),
  };
  const covered = weekVisitors.slice(0, WEEKLY_SUMMARY_VISITOR_LIMIT);
  await weeklySummariesCollection(db).updateOne(
    { _id: summary._id },
    { $set: { visitors: covered, totals, updatedAt: new Date() } }
  );
  return { ...summary, visitors: covered, totals };
}

async function summarizeVisitors(
  db: Db,
  summary: WeeklySummaryDoc,
  avatar: AvatarDoc,
  owner: UserDoc
): Promise<void> {
  const pending = (summary.visitors ?? []).filter((visitor) => visitor.summary === null);
  if (pending.length === 0) return;

  // Looked up again through the same rule as the visitors page: a visitor who
  // is no longer shown to the owner is no longer summarised for them either.
  const { visitors } = await findAvatarVisitors(db, avatar);
  const visitorsByKey = new Map(visitors.map((entry) => [entry.visitor.key, entry]));

  for (const pendingVisitor of pending) {
    const current = visitorsByKey.get(pendingVisitor.key);
    if (current === undefined) {
      await weeklySummariesCollection(db).updateOne(
        { _id: summary._id },
        { $pull: { visitors: { key: pendingVisitor.key } } }
      );
      continue;
    }

    const messages = await messagesCollection(db)
      .find({
        threadId: { $in: current.threads.map((thread) => thread._id) },
        status: 'complete',
        text: { $ne: '' },
        createdAt: { $gte: summary.periodStart, $lt: summary.periodEnd },
      })
      .sort({ createdAt: 1 })
      .limit(WEEK_MESSAGE_LIMIT)
      .toArray();
    const prompt = buildVisitorWeekPrompt(
      owner.name,
      selectTranscriptWindow(
        messages.map((message) => ({ id: message._id, role: message.role, text: message.text }))
      )
    );

    const reply = await buildChatModel({
      model: MEMORY_MODEL,
      temperature: 0,
      maxTokens: WEEKLY_SUMMARY_MAX_TOKENS,
    }).invoke([new SystemMessage(prompt.system), new HumanMessage(prompt.user)]);
    const visitorWeek = parseVisitorWeekOutput(readMessageText(reply));

    await weeklySummariesCollection(db).updateOne(
      { _id: summary._id, 'visitors.key': pendingVisitor.key },
      {
        $set: {
          'visitors.$.summary': visitorWeek.summary,
          'visitors.$.needsAttention': visitorWeek.needsAttention,
          updatedAt: new Date(),
        },
      }
    );
  }
}

async function sendWeeklySummary(
  { db, email, webBaseUrl, apiPublicUrl, signUnsubscribeToken }: WeeklySummaryJobContext,
  summary: WeeklySummaryDoc,
  owner: UserDoc
): Promise<void> {
  const visitors = (summary.visitors ?? []).flatMap((visitor) =>
    visitor.summary === null
      ? []
      : [{ ...visitor, summary: visitor.summary, visitorUrl: `${webBaseUrl}/launch/visitors/${visitor.key}` }]
  );
  if (summary.totals === null || visitors.length === 0) {
    await finishWeeklySummary(db, summary._id, 'skipped', 'No visitor was left to summarise');
    return;
  }

  const token = encodeURIComponent(signUnsubscribeToken(owner._id));
  const message = buildSummaryEmail({
    ownerName: owner.name,
    periodEnd: summary.periodEnd,
    timeZone: readWeeklySummarySettings(owner).timeZone,
    visitors,
    totals: summary.totals,
    visitorsUrl: `${webBaseUrl}/launch/visitors`,
    unsubscribeUrl: `${webBaseUrl}/launch/unsubscribe?token=${token}`,
  });

  await sendEmail(email, {
    to: owner.email,
    ...message,
    headers: {
      'List-Unsubscribe': `<${apiPublicUrl}/v1/weekly-summary/unsubscribe?token=${token}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
    idempotencyKey: summary._id,
  });

  const now = new Date();
  // What was written about each visitor is dropped once it has been delivered;
  // only the flags stay, for the marks on the visitors page.
  await weeklySummariesCollection(db).updateOne(
    { _id: summary._id },
    {
      $set: {
        status: 'sent',
        sentAt: now,
        visitors: [],
        attentionFlags: visitors.flatMap((visitor) =>
          visitor.needsAttention === null ? [] : [{ visitorKey: visitor.key, flag: visitor.needsAttention }]
        ),
        nextAttemptAt: null,
        lastError: null,
        updatedAt: now,
      },
    }
  );
}

async function finishWeeklySummary(
  db: Db,
  summaryId: string,
  status: 'skipped' | 'failed',
  reason: string
): Promise<void> {
  await weeklySummariesCollection(db).updateOne(
    { _id: summaryId },
    { $set: { status, lastError: reason, nextAttemptAt: null, visitors: [], updatedAt: new Date() } }
  );
}

async function recordFailedAttempt(
  { db, log }: WeeklySummaryJobContext,
  summaryId: string,
  error: unknown
): Promise<void> {
  const current = await weeklySummariesCollection(db).findOne({ _id: summaryId });
  if (current === null) return;

  const attempts = current.attempts + 1;
  const retryMinutes = WEEKLY_SUMMARY_RETRY_MINUTES[attempts - 1];
  const isRetryable = !(error instanceof EmailDeliveryError) || error.isRetryable;
  const reason = getErrorMessage(error);

  if (retryMinutes === undefined || !isRetryable) {
    log.error({ err: reason, weeklySummaryId: summaryId }, 'Weekly summary failed for good');
    await finishWeeklySummary(db, summaryId, 'failed', reason);
    return;
  }

  log.warn({ err: reason, weeklySummaryId: summaryId }, 'Weekly summary failed; it will be retried');
  await weeklySummariesCollection(db).updateOne(
    { _id: summaryId },
    {
      $set: {
        attempts,
        nextAttemptAt: new Date(Date.now() + retryMinutes * 60 * 1000),
        lastError: reason,
        updatedAt: new Date(),
      },
    }
  );
}
