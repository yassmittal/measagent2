import { ownAvatarSchema } from '../../me/avatar/schemas.js';

const tags = ['Admin'];

const avatarForReview = {
  ...ownAvatarSchema,
  required: [...ownAvatarSchema.required, 'ownerEmail', 'listingReviewedAt'],
  properties: {
    ...ownAvatarSchema.properties,
    ownerEmail: { type: 'string' },
    listingReviewedAt: { type: 'string', nullable: true },
  },
} as const;

const schemas = Object.freeze({
  listAvatarsForReview: {
    $id: 'list-avatars-for-review',
    tags,
    description:
      'Every avatar with one listing state. Pending comes oldest first; listed ' +
      'and declined come most recently reviewed first. Requires an admin token.',
    querystring: {
      type: 'object',
      required: ['listing'],
      additionalProperties: false,
      properties: { listing: { type: 'string', enum: ['pending', 'listed', 'declined'] } },
    },
    response: {
      200: {
        type: 'object',
        required: ['avatars'],
        properties: { avatars: { type: 'array', items: avatarForReview } },
      },
    },
  },

  reviewAvatar: {
    $id: 'review-avatar',
    tags,
    description:
      'List or decline an avatar. Declining a listed avatar unlists it; the avatar ' +
      'stays live at its link either way. Requires an admin token.',
    params: {
      type: 'object',
      required: ['avatarId'],
      additionalProperties: false,
      properties: { avatarId: { type: 'string' } },
    },
    body: {
      type: 'object',
      required: ['listing'],
      additionalProperties: false,
      properties: { listing: { type: 'string', enum: ['listed', 'declined'] } },
    },
    response: {
      200: {
        type: 'object',
        required: ['avatar'],
        properties: { avatar: avatarForReview },
      },
    },
  },
});

export default schemas;
