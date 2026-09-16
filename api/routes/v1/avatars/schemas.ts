import { AVATAR_HANDLE_PATTERN } from '@measagent/shared/avatars';

const tags = ['Avatars'];

const avatarProfile = {
  type: 'object',
  required: [
    'id',
    'handle',
    'name',
    'pictureUrl',
    'bio',
    'subject',
    'askMeAbout',
    'websiteUrl',
    'availability',
    'isSearchIndexable',
    'updatedAt',
  ],
  properties: {
    id: { type: 'string' },
    handle: { type: 'string' },
    name: { type: 'string' },
    pictureUrl: { type: 'string', nullable: true },
    bio: { type: 'string' },
    subject: { type: 'string', enum: ['person', 'project'] },
    askMeAbout: { type: 'array', items: { type: 'string' } },
    websiteUrl: { type: 'string', nullable: true },
    availability: { type: 'string', enum: ['live', 'paused'] },
    isSearchIndexable: {
      type: 'boolean',
      description: 'Listed, live, and the owner has not hidden it from search engines.',
    },
    updatedAt: { type: 'string' },
  },
} as const;

const schemas = Object.freeze({
  listAvatarDirectory: {
    $id: 'list-avatar-directory',
    tags,
    description: 'Every reviewed, live avatar, most recently approved first.',
    response: {
      200: {
        type: 'object',
        required: ['avatars'],
        properties: { avatars: { type: 'array', items: avatarProfile } },
      },
    },
  },

  loadAvatarProfile: {
    $id: 'load-avatar-profile',
    tags,
    description:
      'The public profile behind an avatar page, listed or not. A paused avatar ' +
      'is returned with availability "paused" rather than as a 404.',
    params: {
      type: 'object',
      required: ['handle'],
      additionalProperties: false,
      properties: { handle: { type: 'string', pattern: AVATAR_HANDLE_PATTERN } },
    },
    response: {
      200: {
        type: 'object',
        required: ['avatar'],
        properties: { avatar: avatarProfile },
      },
    },
  },
});

export default schemas;
