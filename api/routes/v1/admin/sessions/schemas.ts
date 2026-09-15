const tags = ['Admin'];

const schemas = Object.freeze({
  signInAdmin: {
    $id: 'sign-in-admin',
    tags,
    description:
      "Exchange the admin portal's username and password for a short-lived admin " +
      'token. Rate limited per address. Called by the portal server, not a browser.',
    body: {
      type: 'object',
      required: ['username', 'password'],
      additionalProperties: false,
      properties: {
        username: { type: 'string', minLength: 1, maxLength: 200 },
        password: { type: 'string', minLength: 1, maxLength: 200 },
      },
    },
    response: {
      200: {
        type: 'object',
        required: ['sessionToken', 'sessionExpiresAt'],
        properties: {
          sessionToken: { type: 'string' },
          sessionExpiresAt: { type: 'string' },
        },
      },
    },
  },
});

export default schemas;
