const tags = ['Auth'];

const userProfile = {
  type: 'object',
  required: ['id', 'name', 'email', 'pictureUrl', 'consentAcceptedAt'],
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    email: { type: 'string' },
    pictureUrl: { type: 'string', nullable: true },
    consentAcceptedAt: { type: 'string', nullable: true },
  },
} as const;

const schemas = Object.freeze({
  signInWithGoogle: {
    $id: 'sign-in-with-google',
    tags,
    description:
      'Exchange a Google Identity Services credential for a session token. ' +
      'Any conversations held anonymously by the x-device-id on the request ' +
      'are claimed by the account at the same time.',
    body: {
      type: 'object',
      required: ['idToken'],
      additionalProperties: false,
      properties: { idToken: { type: 'string', minLength: 1 } },
    },
    response: {
      200: {
        type: 'object',
        required: ['sessionToken', 'sessionExpiresAt', 'user', 'claimedThreadCount'],
        properties: {
          sessionToken: { type: 'string' },
          sessionExpiresAt: { type: 'string' },
          user: userProfile,
          claimedThreadCount: { type: 'integer' },
        },
      },
    },
  },

  loadSession: {
    $id: 'load-session',
    tags,
    description: 'The account behind the session token on this request.',
    response: {
      200: {
        type: 'object',
        required: ['user'],
        properties: { user: userProfile },
      },
    },
  },
});

export default schemas;
