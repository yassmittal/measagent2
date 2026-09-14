const tags = ['Voice'];

const schemas = Object.freeze({
  openVoiceSession: {
    $id: 'open-voice-session',
    tags,
    description:
      'Mint the routing marker for one live voice session. The browser puts ' +
      "it in the realtime session's instructions; the speech-to-speech " +
      'service hands it back on every /v1/chat/completions call it makes.',
    body: {
      type: 'object',
      required: ['chatId'],
      additionalProperties: false,
      properties: { chatId: { type: 'string' } },
    },
    response: {
      200: {
        type: 'object',
        required: ['routeMarker'],
        properties: { routeMarker: { type: 'string' } },
      },
    },
  },
});

export default schemas;
