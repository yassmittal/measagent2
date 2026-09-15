const schemas = Object.freeze({
  unsubscribeWeeklySummary: {
    $id: 'unsubscribe-weekly-summary',
    tags: ['Weekly summary'],
    description:
      "Stop an owner's weekly email with the token from its unsubscribe link. " +
      'Accepts an empty body or the `List-Unsubscribe=One-Click` form a mail client posts.',
    querystring: {
      type: 'object',
      required: ['token'],
      properties: { token: { type: 'string', minLength: 1 } },
    },
    response: { 204: { type: 'null' } },
  },
});

export default schemas;
