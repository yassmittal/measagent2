const tags = ['Weekly summary'];

const settingsResponse = {
  type: 'object',
  required: ['settings'],
  properties: {
    settings: {
      type: 'object',
      required: ['isEnabled', 'timeZone'],
      properties: {
        isEnabled: { type: 'boolean' },
        timeZone: { type: 'string' },
      },
    },
  },
} as const;

const schemas = Object.freeze({
  loadWeeklySummarySettings: {
    $id: 'load-weekly-summary-settings',
    tags,
    description:
      "Whether the signed-in owner gets a weekly email about their avatar's visitors, " +
      'and the time zone its Monday 09:00 is in. 404 without an avatar.',
    response: { 200: settingsResponse },
  },

  updateWeeklySummarySettings: {
    $id: 'update-weekly-summary-settings',
    tags,
    description: 'Turn the weekly email on or off, or set its time zone (an IANA name).',
    body: {
      type: 'object',
      additionalProperties: false,
      minProperties: 1,
      properties: {
        isEnabled: { type: 'boolean' },
        timeZone: { type: 'string', minLength: 1, maxLength: 64 },
      },
    },
    response: { 200: settingsResponse },
  },
});

export default schemas;
