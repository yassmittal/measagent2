import type { VisitorMemory } from '@measagent/shared';
import type { FastifyInstance } from 'fastify';
import type { Db } from 'mongodb';
import { isAccountOwnerId } from '../../lib/auth/owner-id.js';
import { hasAcceptedTerms } from '../../lib/auth/user-profile.js';
import { findVisitorMemory, recordVisitorTurn } from '../../lib/memory/relationships.js';
import { usersCollection } from '../../shared/collections.js';

/**
 * Memory's part in one turn, shared by typed chat and live voice so the two can
 * never disagree about who is remembered.
 *
 * Like a failing voice, a failing memory never fails a turn: every error in here
 * is logged and swallowed, and the turn goes ahead as if nothing were
 * remembered. Only signed-in visitors who have accepted the terms are
 * remembered at all.
 */
export interface TurnMemory {
  /** Goes into the persona prompt. */
  visitorMemory: VisitorMemory | null;
  /** Call once the turn's messages are stored. */
  recordTurn: () => Promise<void>;
}

const FORGETFUL_TURN: TurnMemory = Object.freeze({
  visitorMemory: null,
  recordTurn: async () => {},
});

export async function prepareTurnMemory(
  fastify: FastifyInstance,
  db: Db,
  ownerId: string,
  avatarId: string
): Promise<TurnMemory> {
  if (!isAccountOwnerId(ownerId)) return FORGETFUL_TURN;

  try {
    const visitor = await usersCollection(db).findOne({ _id: ownerId });
    if (visitor === null || !hasAcceptedTerms(visitor)) return FORGETFUL_TURN;

    return {
      visitorMemory: await findVisitorMemory(db, ownerId, avatarId),
      recordTurn: async () => {
        try {
          await recordVisitorTurn(
            db,
            ownerId,
            avatarId,
            new Date(),
            fastify.config.MA_MEMORY_QUIET_SECONDS
          );
        } catch (error) {
          fastify.log.error({ err: error, avatarId }, 'Failed to record a turn for memory');
        }
      },
    };
  } catch (error) {
    fastify.log.error({ err: error, avatarId }, 'Failed to load visitor memory');
    return FORGETFUL_TURN;
  }
}
