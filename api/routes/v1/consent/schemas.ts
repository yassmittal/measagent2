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
      'When this account accepted the current terms, or null if it has not. ' +
      'An acceptance of superseded wording reads as null.',
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
