import type { Collection, Db } from 'mongodb';
import type { AvatarDoc, MessageDoc, ThreadDoc, UserDoc } from './documents.js';

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
});

export const threadsCollection = (db: Db): Collection<ThreadDoc> =>
  db.collection<ThreadDoc>(COLLECTIONS.threads);

export const messagesCollection = (db: Db): Collection<MessageDoc> =>
  db.collection<MessageDoc>(COLLECTIONS.messages);

export const usersCollection = (db: Db): Collection<UserDoc> =>
  db.collection<UserDoc>(COLLECTIONS.users);

export const avatarsCollection = (db: Db): Collection<AvatarDoc> =>
  db.collection<AvatarDoc>(COLLECTIONS.avatars);
