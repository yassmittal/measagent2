import type { AvatarProfile } from '@measagent/shared/avatars';
import type { Db, Filter } from 'mongodb';
import { avatarsCollection, usersCollection } from '../../shared/collections.js';
import type { AvatarDoc, UserDoc } from '../../shared/documents.js';

/**
 * An avatar is never complete on its own: its name and portrait live on the
 * owner's user document. Every reader that shows or speaks as an avatar goes
 * through here, so none of them can forget the second half.
 */
export interface AvatarWithOwner {
  avatar: AvatarDoc;
  owner: UserDoc;
}

export async function findAvatarWithOwner(
  db: Db,
  filter: Filter<AvatarDoc>
): Promise<AvatarWithOwner | null> {
  const avatar = await avatarsCollection(db).findOne(filter);
  if (avatar === null) return null;

  const owner = await usersCollection(db).findOne({ _id: avatar.ownerId });
  return owner === null ? null : { avatar, owner };
}

export async function findAvatarsWithOwners(
  db: Db,
  filter: Filter<AvatarDoc>,
  sort: Partial<Record<keyof AvatarDoc, 1 | -1>>
): Promise<AvatarWithOwner[]> {
  const avatars = await avatarsCollection(db).find(filter).sort(sort).toArray();
  if (avatars.length === 0) return [];

  // One query for every owner rather than one per avatar.
  const owners = await usersCollection(db)
    .find({ _id: { $in: avatars.map((avatar) => avatar.ownerId) } })
    .toArray();
  const ownersById = new Map(owners.map((owner) => [owner._id, owner]));

  return avatars.flatMap((avatar) => {
    const owner = ownersById.get(avatar.ownerId);
    return owner === undefined ? [] : [{ avatar, owner }];
  });
}

export function toAvatarProfile({ avatar, owner }: AvatarWithOwner): AvatarProfile {
  return {
    id: avatar._id,
    handle: avatar.handle,
    name: owner.name,
    pictureUrl: owner.pictureUrl,
    bio: avatar.bio,
    availability: avatar.availability,
  };
}
