const tags = ['Voice'];

const schemas = Object.freeze({
  chatCompletions: {
    $id: 'voice-chat-completions',
    tags,
    description:
      'OpenAI Chat Completions-compatible endpoint used by the speech-to-speech ' +
      'service as its language model. Authenticated with a bearer token from ' +
      'MA_S2S_API_KEY; the conversation is routed by the `ma-route:` marker line ' +
      'in the system message.',
    body: { type: 'object', additionalProperties: true },
  },
});

export default schemas;
