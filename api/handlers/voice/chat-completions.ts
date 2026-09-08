import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { Db } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { toThreadMessage } from '../../lib/chat/messages.js';
import { buildPersonaSystemPrompt } from '../../lib/chat/persona.js';
import { streamReply } from '../../lib/chat/reply-runner.js';
import {
  lastUserMessageText,
  type LiveVoiceMarker,
  parseRouteMarker,
} from '../../lib/voice/route-marker.js';
import { buildChatModel } from '../../services/language-model.js';
import { messagesCollection, threadsCollection } from '../../shared/collections.js';
import { VOICE_HISTORY_TURN_LIMIT, VOICE_MAX_TOKENS } from '../../shared/constants.js';
import type { MessageDoc } from '../../shared/documents.js';


interface ChatCompletionsBody {
  model?: string;
  messages?: Array<{ role?: string; content?: unknown }>;
  stream?: boolean;
}

const WARMUP_REPLY = "Hello! I'm ready.";

const SSE_KEEPALIVE_MS = 5000;

const completionId = (): string => `chatcmpl-${uuidv4()}`;

export async function chatCompletions(
  this: FastifyInstance,
  request: FastifyRequest<{ Body: ChatCompletionsBody }>,
  reply: FastifyReply
): Promise<void> {
  const expectedToken = this.config.MA_S2S_API_KEY;
  if (expectedToken === '') {
    return reply.serviceUnavailable('The live voice endpoint is not configured');
  }
  if (request.headers.authorization !== `Bearer ${expectedToken}`) {
    return reply.unauthorized('Unauthorized');
  }

  const body = request.body ?? {};
  const model = typeof body.model === 'string' ? body.model : 'measagent';
  const id = completionId();

  const marker = parseRouteMarker(body.messages);
  if (marker === null) {
    return sendCompletion(reply, id, model, WARMUP_REPLY);
  }

  const userPrompt = lastUserMessageText(body.messages);
  if (userPrompt === null) {
    return sendOpenAiError(reply, 400, 'No user message found in `messages`');
  }

  const db = this.mongo.db;
  if (db === undefined) {
    return sendOpenAiError(reply, 503, 'Storage is not available', 'server_error');
  }

  if (body.stream !== true) {
    try {
      const spoken = await runLiveVoiceTurn(this, db, marker, userPrompt);
      return sendCompletion(reply, id, model, spoken);
    } catch (error) {
      this.log.error({ err: error, threadId: marker.threadId }, 'Live voice turn failed');
      return sendOpenAiError(reply, 500, 'Live voice turn failed', 'server_error');
    }
  }

  const stream = new ChatCompletionStream(reply, id, model);
  try {
    await runLiveVoiceTurn(this, db, marker, userPrompt, (delta) =>
      stream.sendDelta(delta)
    );
    stream.finish();
  } catch (error) {
    this.log.error(
      { err: error, threadId: marker.threadId },
      'Live voice turn failed mid-stream'
    );
    stream.abort();
  }
}

async function runLiveVoiceTurn(
  fastify: FastifyInstance,
  db: Db,
  marker: LiveVoiceMarker,
  userPrompt: string,
  onDelta?: (delta: string) => void
): Promise<string> {
  const thread = await threadsCollection(db).findOne({
    _id: marker.threadId,
    userId: marker.userId,
  });
  if (thread === null) {
    throw new Error(`No thread ${marker.threadId} for ${marker.userId}`);
  }

  const history = await messagesCollection(db)
    .find({ threadId: thread._id })
    .sort({ createdAt: -1 })
    .limit(VOICE_HISTORY_TURN_LIMIT)
    .toArray();

  const now = new Date();
  const turnId = uuidv4();
  const userMessage: MessageDoc = {
    _id: uuidv4(),
    threadId: thread._id,
    userId: marker.userId,
    role: 'user',
    text: userPrompt,
    status: 'complete',
    turnId,
    createdAt: now,
    feedback: null,
  };

  const { text } = await streamReply({
    systemPrompt: buildPersonaSystemPrompt(),
    history: history.reverse().map(toThreadMessage),
    userPrompt,
    model: buildChatModel({ maxTokens: VOICE_MAX_TOKENS }),
    onDelta: (delta) => onDelta?.(delta),
  });

  const replyMessage: MessageDoc = {
    _id: uuidv4(),
    threadId: thread._id,
    userId: marker.userId,
    role: 'assistant',
    text,
    status: 'complete',
    turnId,
    createdAt: new Date(now.getTime() + 1),
    feedback: null,
  };

  await messagesCollection(db).insertMany([userMessage, replyMessage]);
  await threadsCollection(db).updateOne(
    { _id: thread._id },
    { $set: { lastMessageAt: replyMessage.createdAt, updatedAt: replyMessage.createdAt } }
  );

  return text;
}

function sendOpenAiError(
  reply: FastifyReply,
  statusCode: number,
  message: string,
  type = 'invalid_request_error'
): FastifyReply {
  return reply.status(statusCode).send({ error: { message, type, code: null } });
}

function sendCompletion(
  reply: FastifyReply,
  id: string,
  model: string,
  content: string
): FastifyReply {
  return reply.send({
    id,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      { index: 0, message: { role: 'assistant', content }, finish_reason: 'stop' },
    ],
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
  });
}

class ChatCompletionStream {
  private readonly keepalive: ReturnType<typeof setInterval>;

  constructor(
    private readonly reply: FastifyReply,
    private readonly id: string,
    private readonly model: string
  ) {
    reply.hijack();
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    this.keepalive = setInterval(() => this.writeRaw(': keepalive\n\n'), SSE_KEEPALIVE_MS);
    this.keepalive.unref?.();
    reply.raw.on('close', () => this.stopKeepalive());
  }

  sendDelta(content: string): void {
    this.sendChunk({ content });
  }

  finish(): void {
    this.sendChunk({}, 'stop');
    this.writeRaw('data: [DONE]\n\n');
    this.stopKeepalive();
    this.reply.raw.end();
  }

  abort(): void {
    this.stopKeepalive();
    this.reply.raw.destroy();
  }

  private sendChunk(delta: Record<string, unknown>, finishReason: string | null = null): void {
    this.writeRaw(
      `data: ${JSON.stringify({
        id: this.id,
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model: this.model,
        choices: [{ index: 0, delta, finish_reason: finishReason }],
      })}\n\n`
    );
  }

  private writeRaw(frame: string): void {
    if (this.reply.raw.destroyed) return;
    this.reply.raw.write(frame);
  }

  private stopKeepalive(): void {
    clearInterval(this.keepalive);
  }
}
