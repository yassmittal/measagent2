const SERVER_AUDIO_SAMPLE_RATE = 16000;
const MIC_CHUNK_MS = 40;

export type LiveVoiceStatus = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error';

export interface LiveVoiceTranscript {
  role: 'user' | 'assistant';
  text: string;
  isFinal: boolean;
}

export interface LiveVoiceClientOptions {
  url: string;
  instructions: string;
  onStatusChange: (status: LiveVoiceStatus) => void;
  onTranscript: (transcript: LiveVoiceTranscript) => void;
  onError: (error: Error) => void;
}

interface RealtimeEvent {
  type?: string;
  delta?: unknown;
  transcript?: unknown;
  error?: { message?: string };
}

export class LiveVoiceClient {
  private socket: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private microphone: MediaStream | null = null;
  private captureNode: AudioWorkletNode | null = null;
  private playbackNode: AudioWorkletNode | null = null;
  private isSessionConfigured = false;
  private isStopped = false;

  constructor(private readonly options: LiveVoiceClientOptions) {}

  async connect(): Promise<void> {
    this.options.onStatusChange('connecting');

    this.microphone = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });

    await this.startAudioGraph(this.microphone);
    this.openSocket();
  }

  disconnect(): void {
    this.isStopped = true;
    this.isSessionConfigured = false;

    this.socket?.close(1000, 'client closed');
    this.socket = null;

    this.captureNode?.disconnect();
    this.playbackNode?.disconnect();
    this.captureNode = null;
    this.playbackNode = null;

    for (const track of this.microphone?.getTracks() ?? []) track.stop();
    this.microphone = null;

    void this.audioContext?.close();
    this.audioContext = null;

    this.options.onStatusChange('idle');
  }

  setMicrophoneEnabled(enabled: boolean): void {
    this.captureNode?.port.postMessage({ kind: 'capture', value: enabled });
  }

  private async startAudioGraph(microphone: MediaStream): Promise<void> {
    const audioContext = new AudioContext({ latencyHint: 'interactive' });
    this.audioContext = audioContext;

    if (audioContext.state === 'suspended') await audioContext.resume();

    await audioContext.audioWorklet.addModule('/worklets/mic-capture.js');
    await audioContext.audioWorklet.addModule('/worklets/audio-playback.js');

    const captureNode = new AudioWorkletNode(audioContext, 'mic-capture', {
      numberOfInputs: 1,
      numberOfOutputs: 0,
      processorOptions: { chunkMs: MIC_CHUNK_MS },
    });
    captureNode.port.onmessage = (event) => this.sendMicrophoneChunk(event.data);
    audioContext.createMediaStreamSource(microphone).connect(captureNode);
    this.captureNode = captureNode;

    const playbackNode = new AudioWorkletNode(audioContext, 'audio-playback', {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [1],
    });
    playbackNode.port.postMessage({
      kind: 'config',
      inputRate: SERVER_AUDIO_SAMPLE_RATE,
    });
    playbackNode.connect(audioContext.destination);
    this.playbackNode = playbackNode;
  }

  private openSocket(): void {
    const socket = new WebSocket(this.options.url);
    socket.binaryType = 'arraybuffer';
    this.socket = socket;

    socket.onopen = () => {
      this.send({
        type: 'session.update',
        session: { type: 'realtime', instructions: this.options.instructions },
      });
    };

    socket.onmessage = (event) => {
      void this.handleServerEvent(event.data);
    };

    socket.onerror = () => {
      if (this.isStopped) return;
      this.options.onError(new Error('Lost the connection to the voice service'));
      this.options.onStatusChange('error');
    };

    socket.onclose = (event) => {
      if (this.isStopped || event.code === 1000) return;
      this.options.onError(
        new Error(`Voice service closed the connection (${event.code})`),
      );
      this.options.onStatusChange('error');
    };
  }

  private async handleServerEvent(raw: unknown): Promise<void> {
    const text =
      typeof raw === 'string'
        ? raw
        : raw instanceof Blob
          ? await raw.text()
          : raw instanceof ArrayBuffer
            ? new TextDecoder().decode(raw)
            : null;
    if (text === null) return;

    let event: RealtimeEvent;
    try {
      event = JSON.parse(text) as RealtimeEvent;
    } catch {
      return; // A frame we cannot parse is not worth dropping the session for.
    }

    switch (event.type) {
      case 'session.updated':
        this.isSessionConfigured = true;
        this.options.onStatusChange('listening');
        break;

      case 'input_audio_buffer.speech_started':
        this.playbackNode?.port.postMessage({ kind: 'clear' });
        this.options.onStatusChange('listening');
        break;

      case 'response.output_audio.delta':
      case 'response.audio.delta':
        this.enqueueAudio(event.delta);
        this.options.onStatusChange('speaking');
        break;

      case 'conversation.item.input_audio_transcription.delta':
        this.emitTranscript('user', event.delta, false);
        break;

      case 'conversation.item.input_audio_transcription.completed':
        this.emitTranscript('user', event.transcript, true);
        break;

      case 'response.output_audio_transcript.delta':
      case 'response.audio_transcript.delta':
        this.emitTranscript('assistant', event.delta, false);
        break;

      case 'response.output_audio_transcript.done':
      case 'response.audio_transcript.done':
        this.emitTranscript('assistant', event.transcript, true);
        break;

      case 'response.done':
        this.options.onStatusChange('listening');
        break;

      case 'error':
        this.options.onError(new Error(event.error?.message ?? 'Voice service error'));
        break;
    }
  }

  private emitTranscript(
    role: LiveVoiceTranscript['role'],
    value: unknown,
    isFinal: boolean,
  ): void {
    if (typeof value !== 'string' || value === '') return;
    this.options.onTranscript({ role, text: value, isFinal });
  }

  private enqueueAudio(base64: unknown): void {
    if (typeof base64 !== 'string' || this.playbackNode === null) return;

    const pcm16 = decodeBase64ToPcm16(base64);
    const samples = new Float32Array(pcm16.length);
    for (let index = 0; index < pcm16.length; index += 1) {
      samples[index] = (pcm16[index] ?? 0) / 0x8000;
    }

    this.playbackNode.port.postMessage({ kind: 'audio', samples }, [samples.buffer]);
  }

  private sendMicrophoneChunk(chunk: ArrayBuffer): void {
    if (!this.isSessionConfigured) return;
    this.send({ type: 'input_audio_buffer.append', audio: encodeBase64(chunk) });
  }

  private send(payload: Record<string, unknown>): void {
    if (this.socket?.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify(payload));
  }
}

function encodeBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const CHUNK = 0x8000;
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + CHUNK));
  }
  return btoa(binary);
}

function decodeBase64ToPcm16(base64: string): Int16Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Int16Array(bytes.buffer, 0, bytes.length >> 1);
}

export function normalizeRealtimeUrl(configured: string): string | null {
  const trimmed = configured.trim().replace(/\/+$/, '');
  if (trimmed === '') return null;
  if (trimmed.startsWith('ws://') || trimmed.startsWith('wss://')) {
    return trimmed.endsWith('/v1/realtime') ? trimmed : `${trimmed}/v1/realtime`;
  }
  const secure = trimmed.startsWith('https://');
  const host = trimmed.replace(/^https?:\/\//, '');
  return `${secure ? 'wss' : 'ws'}://${host}/v1/realtime`;
}
