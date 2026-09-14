import type { Db } from 'mongodb';
import { messagesCollection, threadsCollection } from '../../shared/collections.js';

export async function claimDeviceThreadsForAccount(
  db: Db,
  deviceOwnerId: string,
  accountOwnerId: string
): Promise<number> {
  const claimedBy = { $set: { userId: accountOwnerId } };

  await messagesCollection(db).updateMany({ userId: deviceOwnerId }, claimedBy);
  const threads = await threadsCollection(db).updateMany(
    { userId: deviceOwnerId },
    claimedBy
  );

  return threads.modifiedCount;
}
