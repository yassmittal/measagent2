import type { OutgoingHttpHeaders } from 'node:http';
import type { FastifyReply } from 'fastify';
import type { ChatStreamEvent } from '@measagent/shared';

/**
 * SSE framing for the reply stream.
 *
 * The browser reads this with `fetch` + a `ReadableStream` reader rather than
 * `EventSource`, because the request is a POST with a body and a device header
 * and `EventSource` can send neither. The wire format is still SSE so the
 * stream stays greppable and proxy-friendly.
 */

/**
 * Proxies and load balancers idle out long silences, and the model can think
 * for several seconds before its first token. Comment frames keep bytes moving.
 */
const KEEPALIVE_MS = 5000;

export class ChatEventStream {
  private readonly keepalive: ReturnType<typeof setInterval>;
  private closed = false;

  constructor(private readonly reply: FastifyReply) {
    // Hijacking takes the response away from Fastify, which also skips the
    // hooks that would have written CORS headers onto it. Whatever the hooks
    // already staged is carried over by hand, or the browser rejects the
    // stream even though a preflight on the same route succeeds.
    const staged = reply.getHeaders() as OutgoingHttpHeaders;
    reply.hijack();
    reply.raw.writeHead(200, {
      ...staged,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      // Nginx buffers proxied responses by default, which would hold the whole
      // reply until the turn ended and defeat streaming entirely.
      'X-Accel-Buffering': 'no',
    });

    this.keepalive = setInterval(() => this.writeRaw(': keepalive\n\n'), KEEPALIVE_MS);
    this.keepalive.unref?.();
    reply.raw.on('close', () => this.close());
  }

  /** True once the client has gone away, so a running turn can stop early. */
  get isClosed(): boolean {
    return this.closed || this.reply.raw.destroyed;
  }

  send(event: ChatStreamEvent): void {
    this.writeRaw(`data: ${JSON.stringify(event)}\n\n`);
  }

  end(): void {
    this.writeRaw('data: [DONE]\n\n');
    this.close();
  }

  private writeRaw(frame: string): void {
    if (this.reply.raw.destroyed) return;
    this.reply.raw.write(frame);
  }

  private close(): void {
    if (this.closed) return;
    this.closed = true;
    clearInterval(this.keepalive);
    if (!this.reply.raw.destroyed) this.reply.raw.end();
  }
}
