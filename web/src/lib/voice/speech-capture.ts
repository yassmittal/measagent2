import type { TranscriptionSession } from '@measagent/shared';
import { API_BASE_URL, apiIdentityHeaders } from '../api-client';

const MIC_CHUNK_MS = 50;
const FINAL_TRANSCRIPT_GRACE_MS = 1500;

export type SpeechCaptureFailure = 'mic_denied' | 'not_configured' | 'unreachable';

/**
 * Whether a failure will keep failing until something outside the page changes.
 * A blocked microphone or a provider that is switched off will not fix itself,
 * so the control goes dead; anything else is worth another press.
 */
export const isPermanentFailure = (failure: SpeechCaptureFailure): boolean =>
  failure === 'mic_denied' || failure === 'not_configured';

export class SpeechCaptureError extends Error {
  constructor(
    readonly failure: SpeechCaptureFailure,
    message: string,
  ) {
    super(message);
    this.name = 'SpeechCaptureError';
  }
}

interface TurnMessage {
  type?: string;
  turn_order?: number;
  transcript?: string;
}

interface SpeechCaptureOptions {
  onTranscriptChange: (transcript: string) => void;
}

export class SpeechCaptureSession {
  private socket: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private microphone: MediaStream | null = null;
  private captureNode: AudioWorkletNode | null = null;

  private readonly transcriptByTurnOrder = new Map<number, string>();

  private resolveFinalTranscript: (() => void) | null = null;

  constructor(private readonly options: SpeechCaptureOptions) {}

  async start(): Promise<void> {
    this.microphone = await openMicrophone();
    const session = await requestTranscriptionSession();
    await this.startAudioGraph(this.microphone, session.sampleRate);
    await this.openSocket(session.websocketUrl);
  }

  async stop(): Promise<string> {
    const socket = this.socket;
    if (socket !== null && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'Terminate' }));
      await this.waitForFinalTranscript();
    }

    const transcript = this.readTranscript();
    this.teardown();
    return transcript;
  }

  abort(): void {
    this.transcriptByTurnOrder.clear();
    this.teardown();
  }

  private async startAudioGraph(
    microphone: MediaStream,
    sampleRate: number,
  ): Promise<void> {
    const audioContext = new AudioContext({ latencyHint: 'interactive' });
    this.audioContext = audioContext;
    if (audioContext.state === 'suspended') await audioContext.resume();

    await audioContext.audioWorklet.addModule('/worklets/mic-capture.js');

    const captureNode = new AudioWorkletNode(audioContext, 'mic-capture', {
      numberOfInputs: 1,
      numberOfOutputs: 0,
      processorOptions: { chunkMs: MIC_CHUNK_MS, targetSampleRate: sampleRate },
    });
    captureNode.port.onmessage = (event) => this.sendAudioChunk(event.data);
    audioContext.createMediaStreamSource(microphone).connect(captureNode);
    this.captureNode = captureNode;
  }

  private openSocket(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(url);
      socket.binaryType = 'arraybuffer';
      this.socket = socket;

      socket.onopen = () => resolve();
      socket.onmessage = (event) => this.handleServerMessage(event.data);
      socket.onerror = () =>
        reject(new SpeechCaptureError('unreachable', 'The voice service refused'));
      socket.onclose = () => this.resolveFinalTranscript?.();
    });
  }

  private sendAudioChunk(chunk: unknown): void {
    if (!(chunk instanceof ArrayBuffer)) return;
    if (this.socket?.readyState !== WebSocket.OPEN) return;
    this.socket.send(chunk);
  }

  private handleServerMessage(raw: unknown): void {
    if (typeof raw !== 'string') return;

    let message: TurnMessage;
    try {
      message = JSON.parse(raw) as TurnMessage;
    } catch {
      return;
    }

    if (message.type === 'Termination') {
      this.resolveFinalTranscript?.();
      return;
    }

    if (message.type !== 'Turn' || typeof message.transcript !== 'string') return;

    this.transcriptByTurnOrder.set(message.turn_order ?? 0, message.transcript);
    this.options.onTranscriptChange(this.readTranscript());
  }

  private readTranscript(): string {
    return [...this.transcriptByTurnOrder.entries()]
      .sort(([left], [right]) => left - right)
      .map(([, transcript]) => transcript.trim())
      .filter((transcript) => transcript !== '')
      .join(' ');
  }

  private waitForFinalTranscript(): Promise<void> {
    return new Promise((resolve) => {
      const settle = () => {
        clearTimeout(deadline);
        this.resolveFinalTranscript = null;
        resolve();
      };
      const deadline = setTimeout(settle, FINAL_TRANSCRIPT_GRACE_MS);
      this.resolveFinalTranscript = settle;
    });
  }

  private teardown(): void {
    this.resolveFinalTranscript = null;

    if (this.socket !== null) {
      this.socket.onclose = null;
      this.socket.close();
      this.socket = null;
    }

    this.captureNode?.disconnect();
    this.captureNode = null;

    for (const track of this.microphone?.getTracks() ?? []) track.stop();
    this.microphone = null;

    void this.audioContext?.close();
    this.audioContext = null;
  }
}

async function openMicrophone(): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      throw new SpeechCaptureError('mic_denied', 'Microphone access is blocked');
    }
    throw new SpeechCaptureError('unreachable', 'No microphone is available');
  }
}

async function requestTranscriptionSession(): Promise<TranscriptionSession> {
  const response = await fetch(`${API_BASE_URL}/v1/transcription/sessions`, {
    method: 'POST',
    headers: apiIdentityHeaders(),
  });

  if (response.status === 503) {
    throw new SpeechCaptureError('not_configured', 'Voice input is not switched on');
  }
  if (!response.ok) {
    throw new SpeechCaptureError('unreachable', 'Could not start voice input');
  }

  return (await response.json()) as TranscriptionSession;
}
