import type { Db } from 'mongodb';
import { messagesCollection, threadsCollection } from '../../shared/collections.js';

export interface ClaimedThreads {
  /** Conversations the device had, each now moved onto or merged into the account. */
  threadCount: number;
  /** Every avatar the device had talked to — the memories the account now has new material for. */
  avatarIds: string[];
}

/**
 * Hand a device's conversations to the account that just signed in on it.
 *
 * The product is one continuing conversation per visitor per avatar, and the web
 * app opens exactly one. So a device conversation with an avatar the account
 * already talks to is **merged into** the account's conversation rather than
 * moved beside it: moved beside it, whichever one the browser opened would hide
 * the other, and signing out, chatting, and signing back in would appear to
 * replace the account's history. Messages keep their own timestamps, so a merged
 * conversation reads in the order it was said.
 *
 * Messages move before their thread is touched, because reads are authorised
 * against the thread: a failure part-way leaves the rest on the device thread,
 * and the next sign-in finishes the job.
 */
export async function claimDeviceThreadsForAccount(
  db: Db,
  deviceOwnerId: string,
  accountOwnerId: string
): Promise<ClaimedThreads> {
  const deviceThreads = await threadsCollection(db)
    .find({ userId: deviceOwnerId })
    .sort({ createdAt: 1 })
    .toArray();

  for (const deviceThread of deviceThreads) {
    const accountThread = await threadsCollection(db).findOne(
      { userId: accountOwnerId, avatarId: deviceThread.avatarId },
      { sort: { lastMessageAt: -1 } }
    );

    if (accountThread === null) {
      await messagesCollection(db).updateMany(
        { threadId: deviceThread._id },
        { $set: { userId: accountOwnerId } }
      );
      await threadsCollection(db).updateOne(
        { _id: deviceThread._id },
        { $set: { userId: accountOwnerId } }
      );
      continue;
    }

    await messagesCollection(db).updateMany(
      { threadId: deviceThread._id },
      { $set: { threadId: accountThread._id, userId: accountOwnerId } }
    );
    await threadsCollection(db).updateOne(
      { _id: accountThread._id },
      { $max: { lastMessageAt: deviceThread.lastMessageAt, updatedAt: deviceThread.updatedAt } }
    );
    await threadsCollection(db).deleteOne({ _id: deviceThread._id, userId: deviceOwnerId });
  }

  return {
    threadCount: deviceThreads.length,
    avatarIds: [...new Set(deviceThreads.map((thread) => thread.avatarId))],
  };
}
