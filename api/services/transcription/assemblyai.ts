import type { TranscriptionSession } from '@measagent/shared';
import type { StreamingTranscriber } from './types.js';

const TOKEN_URL = 'https://streaming.assemblyai.com/v3/token';
const SOCKET_URL = 'wss://streaming.assemblyai.com/v3/ws';

const TOKEN_LIFETIME_SECONDS = 120;

const AUDIO_ENCODING = 'pcm_s16le';
const SAMPLE_RATE_HZ = 16000;

interface TokenResponse {
  token?: unknown;
}

class AssemblyAiTranscriber implements StreamingTranscriber {
  readonly name = 'assemblyai';

  isConfigured(): boolean {
    return Boolean(process.env.ASSEMBLYAI_API_KEY);
  }

  async createSession(): Promise<TranscriptionSession> {
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!apiKey) {
      throw new Error('Speech-to-text is not configured (set ASSEMBLYAI_API_KEY)');
    }

    const tokenRequest = new URL(TOKEN_URL);
    tokenRequest.searchParams.set('expires_in_seconds', String(TOKEN_LIFETIME_SECONDS));

    const response = await fetch(tokenRequest, { headers: { Authorization: apiKey } });
    if (!response.ok) {
      throw new Error(`AssemblyAI refused the token request (${response.status})`);
    }

    const { token } = (await response.json()) as TokenResponse;
    if (typeof token !== 'string' || token === '') {
      throw new Error('AssemblyAI returned a token response with no token');
    }

    const socket = new URL(SOCKET_URL);
    socket.searchParams.set('token', token);
    socket.searchParams.set('encoding', AUDIO_ENCODING);
    socket.searchParams.set('sample_rate', String(SAMPLE_RATE_HZ));

    return {
      websocketUrl: socket.toString(),
      sampleRate: SAMPLE_RATE_HZ,
      expiresAt: new Date(Date.now() + TOKEN_LIFETIME_SECONDS * 1000).toISOString(),
    };
  }
}

export const assemblyAiTranscriber = new AssemblyAiTranscriber();
