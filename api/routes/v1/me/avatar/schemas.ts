import {
  AVATAR_ASK_ME_ABOUT_MAX_TOPICS,
  AVATAR_HANDLE_PATTERN,
  AVATAR_TEXT_LIMITS,
  AVATAR_WEBSITE_URL_PATTERN,
} from '@measagent/shared/avatars';

const tags = ['Avatars'];

const personaFieldSchemas = {
  bio: { type: 'string', minLength: 1, maxLength: AVATAR_TEXT_LIMITS.bio },
  aboutMe: { type: 'string', maxLength: AVATAR_TEXT_LIMITS.aboutMe },
  speakingStyle: { type: 'string', maxLength: AVATAR_TEXT_LIMITS.speakingStyle },
  avoidTopics: { type: 'string', maxLength: AVATAR_TEXT_LIMITS.avoidTopics },
} as const;

const avatarSubjectSchema = { type: 'string', enum: ['person', 'project'] } as const;

/** What an owner may set on the public page. `null` or an empty website string clears it. */
const publicDetailFieldSchemas = {
  askMeAbout: {
    type: 'array',
    maxItems: AVATAR_ASK_ME_ABOUT_MAX_TOPICS,
    items: { type: 'string', maxLength: AVATAR_TEXT_LIMITS.askMeAboutTopic },
  },
  websiteUrl: {
    anyOf: [
      { type: 'null' },
      { type: 'string', maxLength: 0 },
      {
        type: 'string',
        maxLength: AVATAR_TEXT_LIMITS.websiteUrl,
        pattern: AVATAR_WEBSITE_URL_PATTERN,
      },
    ],
  },
  isHiddenFromSearch: { type: 'boolean' },
} as const;

export const ownAvatarSchema = {
  type: 'object',
  required: [
    'id',
    'handle',
    'name',
    'pictureUrl',
    'bio',
    'aboutMe',
    'speakingStyle',
    'avoidTopics',
    'subject',
    'askMeAbout',
    'websiteUrl',
    'availability',
    'listing',
    'isHiddenFromSearch',
    'createdAt',
    'updatedAt',
  ],
  properties: {
    id: { type: 'string' },
    handle: { type: 'string' },
    name: { type: 'string' },
    pictureUrl: { type: 'string', nullable: true },
    bio: { type: 'string' },
    aboutMe: { type: 'string' },
    speakingStyle: { type: 'string' },
    avoidTopics: { type: 'string' },
    subject: avatarSubjectSchema,
    askMeAbout: { type: 'array', items: { type: 'string' } },
    websiteUrl: { type: 'string', nullable: true },
    availability: { type: 'string', enum: ['live', 'paused'] },
    listing: { type: 'string', enum: ['pending', 'listed', 'declined'] },
    isHiddenFromSearch: { type: 'boolean' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
  },
} as const;

const ownAvatarResponse = {
  type: 'object',
  required: ['avatar'],
  properties: { avatar: ownAvatarSchema },
} as const;

const schemas = Object.freeze({
  loadOwnAvatar: {
    $id: 'load-own-avatar',
    tags,
    description:
      "The signed-in account's avatar, including the fields only the model " +
      'reads. 404 when the account has not launched one.',
    response: { 200: ownAvatarResponse },
  },

  launchAvatar: {
    $id: 'launch-avatar',
    tags,
    description:
      'Launch an avatar of the signed-in account. Its name and portrait come ' +
      'from the Google account and cannot be set here. It is live at its handle ' +
      'immediately and listed in the directory only once reviewed.',
    body: {
      type: 'object',
      required: [
        'handle',
        'bio',
        'aboutMe',
        'speakingStyle',
        'avoidTopics',
        'subject',
        'isOwnerAttested',
      ],
      additionalProperties: false,
      properties: {
        handle: { type: 'string', pattern: AVATAR_HANDLE_PATTERN },
        ...personaFieldSchemas,
        subject: avatarSubjectSchema,
        ...publicDetailFieldSchemas,
        isOwnerAttested: {
          type: 'boolean',
          const: true,
          description:
            'The owner confirms this avatar is of themselves, or of something they run.',
        },
      },
    },
    response: { 201: ownAvatarResponse },
  },

  updateOwnAvatar: {
    $id: 'update-own-avatar',
    tags,
    description:
      'Edit or pause the signed-in account\'s avatar. The handle cannot change. ' +
      'Changing the bio, Ask me about or website sends the avatar back to review.',
    body: {
      type: 'object',
      additionalProperties: false,
      minProperties: 1,
      properties: {
        ...personaFieldSchemas,
        subject: avatarSubjectSchema,
        ...publicDetailFieldSchemas,
        availability: { type: 'string', enum: ['live', 'paused'] },
      },
    },
    response: { 200: ownAvatarResponse },
  },
});

export default schemas;
