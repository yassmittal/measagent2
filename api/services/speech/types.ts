export interface SynthesizedSpeech {
  audio: Buffer;
  contentType: string;
}

export interface SpeechSynthesizer {
  readonly name: string;
  isConfigured(): boolean;
  synthesizeSpeech(text: string): Promise<SynthesizedSpeech>;
}
