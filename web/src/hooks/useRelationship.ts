'use client';

import type { RelationshipResponse } from '@measagent/shared';
import { useCallback, useEffect, useState } from 'react';
import { forgetRelationship, loadRelationship } from '@/lib/relationship-client';

interface RelationshipWithAvatar {
  relationship: RelationshipResponse | null;
  /** Memory is written a quiet while after a turn, so whatever shows it asks for a fresh read. */
  reloadRelationship: () => void;
  /** This avatar forgets the visitor; the relationship is re-read afterwards. */
  forgetThisAvatar: () => Promise<void>;
}

/**
 * What one avatar remembers about the signed-in visitor. Re-read whenever
 * `storedUserMessageCount` moves — i.e. after every turn the api has stored —
 * because the count and, a quiet while later, the memory both come from there;
 * and when the terms are accepted, which is what switches memory on.
 */
export function useRelationship(
  avatarId: string,
  isSignedIn: boolean,
  hasAcceptedTerms: boolean,
  storedUserMessageCount: number,
): RelationshipWithAvatar {
  const [relationship, setRelationship] = useState<RelationshipResponse | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: consent, the message count and the reload count are refresh signals, not values read inside the effect.
  useEffect(() => {
    if (!isSignedIn) {
      setRelationship(null);
      return;
    }

    let cancelled = false;
    loadRelationship(avatarId)
      .then((loaded) => {
        if (!cancelled) setRelationship(loaded);
      })
      .catch(() => {
        // The level is decoration on top of the conversation; a failed read
        // leaves the last known value rather than interrupting anything.
      });
    return () => {
      cancelled = true;
    };
  }, [avatarId, isSignedIn, hasAcceptedTerms, storedUserMessageCount, reloadCount]);

  const reloadRelationship = useCallback(() => setReloadCount((count) => count + 1), []);

  const forgetThisAvatar = useCallback(async () => {
    await forgetRelationship(avatarId);
    reloadRelationship();
  }, [avatarId, reloadRelationship]);

  return { relationship, reloadRelationship, forgetThisAvatar };
}
