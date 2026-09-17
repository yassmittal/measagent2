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

/**
 * Whether the public directory shows an avatar. New avatars are `listed`;
 * `declined` is an admin taking one down. `pending` is left over from when
 * listing waited for review, and an owner's next edit lists it.
 */
export type AvatarListing = 'pending' | 'listed' | 'declined';

/**
 * Who the avatar speaks as: the owner, or something the owner runs (a product,
 * project or brand). Either way it is launched from the owner's own account and
 * is never of another person. It decides the wording of the attestation and
 * whether a page describes a `Person` or an `Organization` to search engines.
 */
export type AvatarSubject = 'person' | 'project';

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
  askMeAboutTopic: 60,
  websiteUrl: 200,
});

export const AVATAR_ASK_ME_ABOUT_MAX_TOPICS = 5;

/**
 * An owner's website is shown as a link, so only `https:` is accepted — no
 * `javascript:`, no plain `http:`. Whitespace is excluded so a pasted sentence
 * cannot pass as a URL. Kept free of character classes, which the form's
 * `pattern` attribute compiles under the stricter `v` flag.
 */
export const AVATAR_WEBSITE_URL_PATTERN = '^https://\\S+$';

/** Everything the owner writes. Only `bio` is ever shown to visitors. */
export interface AvatarPersonaFields {
  bio: string;
  aboutMe: string;
  speakingStyle: string;
  avoidTopics: string;
}

/** What the owner shows on the avatar's public page, besides the bio. */
export interface AvatarPublicDetails {
  subject: AvatarSubject;
  /** Short topics a visitor can start with. Empty when the owner wrote none. */
  askMeAbout: string[];
  websiteUrl: string | null;
}

/** What a visitor may know about an avatar. Nothing only the model reads. */
export interface AvatarProfile extends AvatarPublicDetails {
  id: string;
  handle: string;
  name: string;
  pictureUrl: string | null;
  bio: string;
  availability: AvatarAvailability;
  /**
   * Listed, live and not hidden by the owner. The web app may still keep a
   * page out of search for having too little on it, but never puts one in
   * that this says no to.
   */
  isSearchIndexable: boolean;
  updatedAt: string;
}

export interface AvatarProfileResponse {
  avatar: AvatarProfile;
}

export interface AvatarDirectoryResponse {
  avatars: AvatarProfile[];
}

/** The owner's view of their own avatar, including what only the model reads. */
export interface OwnAvatar extends AvatarPersonaFields, AvatarPublicDetails {
  id: string;
  handle: string;
  /** From the owner's Google account, and deliberately not editable. */
  name: string;
  pictureUrl: string | null;
  availability: AvatarAvailability;
  listing: AvatarListing;
  isHiddenFromSearch: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OwnAvatarResponse {
  avatar: OwnAvatar;
}

export interface LaunchAvatarRequest extends AvatarPersonaFields, Partial<AvatarPublicDetails> {
  handle: string;
  subject: AvatarSubject;
  isHiddenFromSearch?: boolean;
  /** The owner's statement that the avatar is of them, or of something they run. */
  isOwnerAttested: true;
}

export type UpdateOwnAvatarRequest = Partial<AvatarPersonaFields & AvatarPublicDetails> & {
  availability?: AvatarAvailability;
  isHiddenFromSearch?: boolean;
};
