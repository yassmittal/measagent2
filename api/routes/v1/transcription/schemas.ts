const tags = ['Transcription'];

const schemas = Object.freeze({
  createSession: {
    $id: 'create-transcription-session',
    tags,
    description:
      'Mint a short-lived, single-use websocket url for one streaming ' +
      'speech-to-text session. The provider credential stays on the server.',
    response: {
      200: {
        type: 'object',
        required: ['websocketUrl', 'sampleRate', 'expiresAt'],
        properties: {
          websocketUrl: { type: 'string' },
          sampleRate: { type: 'integer' },
          expiresAt: { type: 'string' },
        },
      },
    },
  },
});

export default schemas;
