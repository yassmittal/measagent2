import { InferenceClient } from '@huggingface/inference';
import type { SpeechSynthesizer, SynthesizedSpeech } from './types.js';

const KOKORO_MODEL = 'hexgrad/Kokoro-82M';
const KOKORO_PROVIDER = 'fal-ai';

const FALLBACK_CONTENT_TYPE = 'audio/mpeg';

class KokoroSpeechSynthesizer implements SpeechSynthesizer {
  readonly name = 'kokoro';

  private client: InferenceClient | null = null;

  isConfigured(): boolean {
    return Boolean(process.env.HF_TOKEN);
  }

  async synthesizeSpeech(text: string): Promise<SynthesizedSpeech> {
    const spoken = await this.getClient().textToSpeech({
      provider: KOKORO_PROVIDER,
      model: KOKORO_MODEL,
      inputs: text,
    });

    return {
      audio: Buffer.from(await spoken.arrayBuffer()),
      contentType: spoken.type || FALLBACK_CONTENT_TYPE,
    };
  }

  private getClient(): InferenceClient {
    const token = process.env.HF_TOKEN;
    if (!token) throw new Error('Text-to-speech is not configured (set HF_TOKEN)');
    if (this.client === null) this.client = new InferenceClient(token);
    return this.client;
  }
}

export const kokoroSpeechSynthesizer = new KokoroSpeechSynthesizer();
