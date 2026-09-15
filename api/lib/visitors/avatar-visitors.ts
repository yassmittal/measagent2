import type { OwnerVisitor } from '@measagent/shared';
import type { Db } from 'mongodb';
import {
  messagesCollection,
  relationshipsCollection,
  threadsCollection,
  usersCollection,
  weeklySummariesCollection,
} from '../../shared/collections.js';
import { OWNER_NOTICE_SHOWN_SINCE } from '../../shared/constants.js';
import type { AvatarDoc, ThreadDoc } from '../../shared/documents.js';
import { isAccountOwnerId } from '../auth/owner-id.js';
import { hasAcceptedTerms } from '../auth/user-profile.js';
import { toVisitorMemory } from '../memory/relationships.js';

/**
 * Who an owner is shown as having talked to their avatar. Every owner-facing
 * reader — the visitors page, one visitor's conversations, the weekly summary —
 * starts here, so the rule about whose conversations an owner may read is
 * written once:
 *
 * - never the owner's own conversations with their own avatar;
 * - a signed-in visitor only once they have accepted the terms, which say the
 *   person behind an avatar reads what is said to it;
 * - an anonymous visitor only for conversations started after the notice under
 *   the composer told them so (`OWNER_NOTICE_SHOWN_SINCE`).
 */

export interface AvatarVisitor {
  visitor: OwnerVisitor;
  /** The owner id the visitor's conversations are stored under. Never sent to the owner. */
  userId: string;
  /** Oldest first. */
  threads: ThreadDoc[];
}

export interface AvatarVisitors {
  /** Most recently seen first. */
  visitors: AvatarVisitor[];
  hiddenConversationCount: number;
}

export async function findAvatarVisitors(db: Db, avatar: AvatarDoc): Promise<AvatarVisitors> {
  const threads = await threadsCollection(db)
    .find({ avatarId: avatar._id, userId: { $ne: avatar.ownerId } })
    .sort({ createdAt: 1 })
    .toArray();

  const accountIds = [...new Set(threads.map((thread) => thread.userId).filter(isAccountOwnerId))];
  const accounts = await usersCollection(db)
    .find({ _id: { $in: accountIds } })
    .toArray();
  const consentedAccounts = new Map(
    accounts.filter(hasAcceptedTerms).map((account) => [account._id, account])
  );

  const visibleThreads = threads.filter((thread) =>
    isAccountOwnerId(thread.userId)
      ? consentedAccounts.has(thread.userId)
      : thread.createdAt >= OWNER_NOTICE_SHOWN_SINCE
  );

  const threadsByVisitor = new Map<string, ThreadDoc[]>();
  for (const thread of visibleThreads) {
    const visitorThreads = threadsByVisitor.get(thread.userId) ?? [];
    visitorThreads.push(thread);
    threadsByVisitor.set(thread.userId, visitorThreads);
  }

  const [messageCounts, relationships, latestSentSummary] = await Promise.all([
    countVisitorMessagesByThread(db, visibleThreads),
    relationshipsCollection(db)
      .find({ avatarId: avatar._id, userId: { $in: [...consentedAccounts.keys()] } })
      .toArray(),
    weeklySummariesCollection(db).findOne(
      { avatarId: avatar._id, status: 'sent' },
      { sort: { sentAt: -1 }, projection: { attentionFlags: 1 } }
    ),
  ]);
  const relationshipsByVisitor = new Map(relationships.map((doc) => [doc.userId, doc]));
  const attentionByVisitorKey = new Map(
    (latestSentSummary?.attentionFlags ?? []).map(({ visitorKey, flag }) => [visitorKey, flag])
  );

  // Numbered in the order they first came, which is the only thing an owner can
  // tell anonymous visitors apart by. A number moves if an earlier visitor later
  // signs in and their conversations become an account's.
  let anonymousCount = 0;
  const visitors = [...threadsByVisitor].map(([userId, visitorThreads]): AvatarVisitor => {
    const account = consentedAccounts.get(userId);
    const relationship = relationshipsByVisitor.get(userId);
    const [firstThread] = visitorThreads as [ThreadDoc, ...ThreadDoc[]];
    const lastSeenAt = Math.max(...visitorThreads.map((thread) => thread.lastMessageAt.getTime()));

    return {
      userId,
      threads: visitorThreads,
      visitor: {
        // A thread id is not a credential — every read of a thread is checked
        // against its owner — whereas a device id is exactly what an anonymous
        // visitor authenticates with, so it must never be what identifies them.
        key: firstThread._id,
        kind: account === undefined ? 'anonymous' : 'account',
        name: account?.name ?? `Anonymous visitor ${++anonymousCount}`,
        pictureUrl: account?.pictureUrl ?? null,
        conversationCount: visitorThreads.length,
        messageCount: visitorThreads.reduce(
          (total, thread) => total + (messageCounts.get(thread._id) ?? 0),
          0
        ),
        firstSeenAt: firstThread.createdAt.toISOString(),
        lastSeenAt: new Date(lastSeenAt).toISOString(),
        memory: relationship === undefined ? null : toVisitorMemory(relationship),
        needsAttention: attentionByVisitorKey.get(firstThread._id) ?? null,
      },
    };
  });

  visitors.sort((a, b) => b.visitor.lastSeenAt.localeCompare(a.visitor.lastSeenAt));

  return { visitors, hiddenConversationCount: threads.length - visibleThreads.length };
}

async function countVisitorMessagesByThread(
  db: Db,
  threads: ThreadDoc[]
): Promise<Map<string, number>> {
  const counts = await messagesCollection(db)
    .aggregate<{ _id: string; count: number }>([
      { $match: { threadId: { $in: threads.map((thread) => thread._id) }, role: 'user' } },
      { $group: { _id: '$threadId', count: { $sum: 1 } } },
    ])
    .toArray();
  return new Map(counts.map(({ _id, count }) => [_id, count]));
}
