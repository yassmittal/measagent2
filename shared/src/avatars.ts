/**
 * Imported as `@measagent/shared/avatars`, not through the package index.
 *
 * This is the first shared module with runtime values in it, and the index
 * re-exports with `.js` specifiers (required by the api's `nodenext`
 * resolution) that the web app's bundler cannot map back to `.ts` source. Type
 * re-exports are erased before bundling so they never hit that; values are not.
 * A module with no relative imports, reached by its own subpath, resolves
 * under both.
 */

export type AvatarAvailability = 'live' | 'paused';

/** Launching is self-serve; appearing in the public directory is not. */
export type AvatarListing = 'pending' | 'listed' | 'declined';

/**
 * Lowercase letters, digits and inner hyphens, 3-30 long. Written as a string
 * so one definition feeds both the api's JSON schema and the form's `pattern`
 * attribute. The hyphen is escaped because browsers compile `pattern` with the
 * `v` flag, which rejects a bare `-` inside a character class.
 */
export const AVATAR_HANDLE_PATTERN = '^[a-z0-9][a-z0-9\\-]{1,28}[a-z0-9]$';

export const AVATAR_TEXT_LIMITS = Object.freeze({
  bio: 280,
  aboutMe: 2000,
  speakingStyle: 1000,
  avoidTopics: 500,
});

/** Everything the owner writes. Only `bio` is ever shown to visitors. */
export interface AvatarPersonaFields {
  bio: string;
  aboutMe: string;
  speakingStyle: string;
  avoidTopics: string;
}

/** What a visitor may know about an avatar. Nothing only the model reads. */
export interface AvatarProfile {
  id: string;
  handle: string;
  name: string;
  pictureUrl: string | null;
  bio: string;
  availability: AvatarAvailability;
}

export interface AvatarProfileResponse {
  avatar: AvatarProfile;
}

export interface AvatarDirectoryResponse {
  avatars: AvatarProfile[];
}

/** The owner's view of their own avatar, including what only the model reads. */
export interface OwnAvatar extends AvatarPersonaFields {
  id: string;
  handle: string;
  /** From the owner's Google account, and deliberately not editable. */
  name: string;
  pictureUrl: string | null;
  availability: AvatarAvailability;
  listing: AvatarListing;
  createdAt: string;
  updatedAt: string;
}

export interface OwnAvatarResponse {
  avatar: OwnAvatar;
}

export interface LaunchAvatarRequest extends AvatarPersonaFields {
  handle: string;
  /** The owner's statement that the avatar is of them. */
  isOwnerAttested: true;
}

export type UpdateOwnAvatarRequest = Partial<AvatarPersonaFields> & {
  availability?: AvatarAvailability;
};
