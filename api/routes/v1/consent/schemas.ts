const tags = ['Consent'];

const consentResponse = {
  type: 'object',
  required: ['consentAcceptedAt'],
  properties: { consentAcceptedAt: { type: 'string', nullable: true } },
} as const;

const schemas = Object.freeze({
  loadConsent: {
    $id: 'load-consent',
    tags,
    description:
      'When this account accepted the terms, or null if it has not. Accepting ' +
      'once is enough: a later change of wording does not ask again.',
    response: { 200: consentResponse },
  },

  acceptConsent: {
    $id: 'accept-consent',
    tags,
    description: 'Record that this account accepted the terms currently on screen.',
    response: { 200: consentResponse },
  },
});

export default schemas;
