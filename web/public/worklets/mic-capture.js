const DEFAULT_TARGET_SAMPLE_RATE = 16000;
const DEFAULT_CHUNK_MS = 40;

class MicCaptureProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const chunkMs = options?.processorOptions?.chunkMs ?? DEFAULT_CHUNK_MS;
    // The rate is the transcription provider's, passed in rather than fixed
    // here so a provider that wants different audio needs no worklet change.
    const targetSampleRate =
      options?.processorOptions?.targetSampleRate ?? DEFAULT_TARGET_SAMPLE_RATE;

    this.resampleRatio = sampleRate / targetSampleRate;
    this.samplesPerChunk = Math.round((targetSampleRate * chunkMs) / 1000);
    this.pending = new Float32Array(0);
    this.resampled = new Float32Array(this.samplesPerChunk);
    this.capturing = true;

    this.port.onmessage = (event) => {
      if (event.data?.kind === 'capture') this.capturing = Boolean(event.data.value);
    };
  }

  process(inputs) {
    const mono = inputs[0]?.[0];
    if (mono === undefined || mono.length === 0) return true;

    const merged = new Float32Array(this.pending.length + mono.length);
    merged.set(this.pending, 0);
    merged.set(mono, this.pending.length);
    this.pending = merged;

    this.emitFullChunks();
    return true;
  }

  emitFullChunks() {
    const ratio = this.resampleRatio;
    const chunkSize = this.samplesPerChunk;
    const samplesNeeded = Math.ceil(chunkSize * ratio);

    while (this.pending.length >= samplesNeeded) {
      for (let index = 0; index < chunkSize; index += 1) {
        // Linear interpolation. Good enough for speech at these rates, and
        // cheap enough to run inside the audio thread's deadline.
        const position = index * ratio;
        const left = Math.floor(position);
        const start = this.pending[left];
        const end = this.pending[left + 1] ?? start;
        this.resampled[index] = start + (end - start) * (position - left);
      }

      const pcm16 = new Int16Array(chunkSize);
      for (let index = 0; index < chunkSize; index += 1) {
        const sample = Math.max(-1, Math.min(1, this.resampled[index]));
        pcm16[index] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      }

      this.pending = this.pending.slice(Math.floor(chunkSize * ratio));
      if (this.capturing) this.port.postMessage(pcm16.buffer, [pcm16.buffer]);
    }
  }
}

registerProcessor('mic-capture', MicCaptureProcessor);
