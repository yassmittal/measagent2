const FADE_FRAMES = 32;

class AudioPlaybackProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.inputRate = 16000;
    this.stepRatio = this.inputRate / sampleRate;
    this.queue = [];
    this.readIndex = 0;
    this.fractionalPosition = 0;
    this.fadeIn = 0;
    this.fadeOut = 0;
    this.lastSample = 0;

    this.port.onmessage = (event) => {
      const message = event.data;
      if (message?.kind === 'config' && message.inputRate > 0) {
        this.inputRate = message.inputRate;
        this.stepRatio = this.inputRate / sampleRate;
      } else if (message?.kind === 'audio' && message.samples?.length > 0) {
        if (this.queue.length === 0) this.fadeIn = FADE_FRAMES;
        this.queue.push(message.samples);
      } else if (message?.kind === 'clear') {
        this.queue.length = 0;
        this.readIndex = 0;
        this.fractionalPosition = 0;
        this.fadeOut = FADE_FRAMES;
      }
    };
  }

  nextSample() {
    const current = this.queue[0];
    if (current === undefined) return null;

    const sample = current[this.readIndex] ?? 0;
    this.fractionalPosition += this.stepRatio;

    const advance = Math.floor(this.fractionalPosition);
    this.fractionalPosition -= advance;
    this.readIndex += advance;

    while (this.queue.length > 0 && this.readIndex >= this.queue[0].length) {
      this.readIndex -= this.queue[0].length;
      this.queue.shift();
    }
    return sample;
  }

  process(_inputs, outputs) {
    const channel = outputs[0]?.[0];
    if (channel === undefined) return true;

    for (let frame = 0; frame < channel.length; frame += 1) {
      const sample = this.nextSample();

      if (sample === null) {
        // Ramp to silence rather than cutting, so a queue that runs dry
        // mid-word does not click.
        channel[frame] = this.fadeOut > 0 ? (this.lastSample * this.fadeOut--) / FADE_FRAMES : 0;
        continue;
      }

      let value = sample;
      if (this.fadeIn > 0) value *= (FADE_FRAMES - this.fadeIn--) / FADE_FRAMES;
      this.lastSample = value;
      channel[frame] = value;
    }
    return true;
  }
}

registerProcessor('audio-playback', AudioPlaybackProcessor);
