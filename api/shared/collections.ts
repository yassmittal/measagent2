import type { Collection, Db } from 'mongodb';
import type {
  AvatarDoc,
  MessageDoc,
  RelationshipDoc,
  ReturnReminderDoc,
  ThreadDoc,
  UserDoc,
  WeeklySummaryDoc,
} from './documents.js';

/**
 * Collection names are looked up here rather than typed at each call site, so a
 * rename is one edit and a typo is a compile error instead of a silently empty
 * result set.
 */
export const COLLECTIONS = Object.freeze({
  users: 'users',
  avatars: 'avatars',
  threads: 'threads',
  messages: 'messages',
  relationships: 'relationships',
  returnReminders: 'returnReminders',
  weeklySummaries: 'weeklySummaries',
});

export const threadsCollection = (db: Db): Collection<ThreadDoc> =>
  db.collection<ThreadDoc>(COLLECTIONS.threads);

export const messagesCollection = (db: Db): Collection<MessageDoc> =>
  db.collection<MessageDoc>(COLLECTIONS.messages);

export const usersCollection = (db: Db): Collection<UserDoc> =>
  db.collection<UserDoc>(COLLECTIONS.users);

export const avatarsCollection = (db: Db): Collection<AvatarDoc> =>
  db.collection<AvatarDoc>(COLLECTIONS.avatars);

export const relationshipsCollection = (db: Db): Collection<RelationshipDoc> =>
  db.collection<RelationshipDoc>(COLLECTIONS.relationships);

export const returnRemindersCollection = (db: Db): Collection<ReturnReminderDoc> =>
  db.collection<ReturnReminderDoc>(COLLECTIONS.returnReminders);

export const weeklySummariesCollection = (db: Db): Collection<WeeklySummaryDoc> =>
  db.collection<WeeklySummaryDoc>(COLLECTIONS.weeklySummaries);
