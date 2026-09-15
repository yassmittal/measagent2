/**
 * What an avatar remembers about one visitor. Written by the api's memory pass
 * from that visitor's conversations with that avatar, and never by a request.
 */
export interface VisitorMemory {
  summary: string;
  interests: string[];
  /** Things the visitor left unfinished — what a return reminder follows up on. */
  openThreads: string[];
}

/** `GET /v1/relationships/:avatarId` — the signed-in visitor's own view. */
export interface RelationshipResponse {
  /** False until the terms are accepted; nothing is remembered before that. */
  isMemoryOn: boolean;
  /** Every message the visitor has sent this avatar, across conversations. */
  userMessageCount: number;
  /** Null when nothing is remembered yet. */
  memory: VisitorMemory | null;
  memoryUpdatedAt: string | null;
}

/**
 * Messages sent needed to reach each level after the first. A level measures
 * how much someone has talked with an avatar — which is what its memory is
 * made of — and nothing else: it unlocks nothing.
 */
export const RELATIONSHIP_LEVEL_THRESHOLDS = Object.freeze([10, 25, 50, 100, 200]);

export interface RelationshipLevel {
  level: number;
  /** Null at the highest level. */
  messagesToNextLevel: number | null;
}

export function describeRelationshipLevel(userMessageCount: number): RelationshipLevel {
  const reached = RELATIONSHIP_LEVEL_THRESHOLDS.filter((threshold) => userMessageCount >= threshold);
  const nextThreshold = RELATIONSHIP_LEVEL_THRESHOLDS[reached.length];
  return {
    level: reached.length + 1,
    messagesToNextLevel: nextThreshold === undefined ? null : nextThreshold - userMessageCount,
  };
}
