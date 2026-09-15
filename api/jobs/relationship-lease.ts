import type { FastifyBaseLogger } from 'fastify';
import type { Db } from 'mongodb';
import { relationshipsCollection } from '../shared/collections.js';
import { BACKGROUND_LEASE_SECONDS } from '../shared/constants.js';
import type { RelationshipDoc } from '../shared/documents.js';

/**
 * Several api instances may run the background passes at once. What stops them
 * doing the same work twice is this lease: an atomic update that only one of
 * them can win. What makes a crash harmless is that it expires.
 */

export interface JobContext {
  db: Db;
  log: FastifyBaseLogger;
  quietSeconds: number;
  reminderAfterSeconds: number;
}

export type RelationshipDueField = 'memoryDueAt' | 'reminderDueAt';

export async function claimDueRelationship(
  db: Db,
  dueField: RelationshipDueField
): Promise<RelationshipDoc | null> {
  const now = new Date();
  return relationshipsCollection(db).findOneAndUpdate(
    {
      [dueField]: { $lte: now },
      $or: [{ leaseUntil: null }, { leaseUntil: { $lte: now } }],
    },
    { $set: { leaseUntil: secondsFromNow(BACKGROUND_LEASE_SECONDS) } },
    { sort: { [dueField]: 1 }, returnDocument: 'after' }
  );
}

export async function releaseRelationship(db: Db, relationship: RelationshipDoc): Promise<void> {
  await relationshipsCollection(db).updateOne(
    { _id: relationship._id },
    { $set: { leaseUntil: null } }
  );
}

/**
 * Conditional on the due time the pass started from: a turn that arrived while
 * the pass was running has moved it, and overwriting it would lose that turn.
 */
export async function rescheduleRelationship(
  db: Db,
  relationship: RelationshipDoc,
  dueField: RelationshipDueField,
  dueAt: Date | null
): Promise<void> {
  await relationshipsCollection(db).updateOne(
    { _id: relationship._id, [dueField]: relationship[dueField] },
    { $set: { [dueField]: dueAt } }
  );
}

export function secondsFromNow(seconds: number): Date {
  return new Date(Date.now() + seconds * 1000);
}
