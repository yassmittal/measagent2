import type { FastifyReply, FastifyRequest } from 'fastify';
import type { SendMessageRequest, ThreadMessage } from '@measagent/shared';
import type { Db } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { deriveThreadTitle, toThreadMessage, toThreadSummary } from '../../lib/chat/messages.js';
import { buildPersonaSystemPrompt } from '../../lib/chat/persona.js';
import { streamReply } from '../../lib/chat/reply-runner.js';
import { buildChatModel, isChatModelConfigured } from '../../services/language-model.js';
import { ChatEventStream } from '../../shared/chat-stream.js';
import { messagesCollection, threadsCollection } from '../../shared/collections.js';
import { HISTORY_TURN_LIMIT, MAX_PROMPT_LENGTH } from '../../shared/constants.js';
import type { MessageDoc, ThreadDoc } from '../../shared/documents.js';
import { getErrorMessage } from '../../shared/errors.js';
import { readOwnerId } from '../../shared/identity.js';

/**
 * `POST /v1/chats` — send a message and stream the reply.
 *
 * The user's message and an empty reply row are both written *before* the model
 * is called. That ordering is what makes a dropped connection recoverable: the
 * reply exists as `resolving`, so a reload can show "may still be writing this"
 * instead of silently losing the turn.
 */
export async function sendMessage(
  this: FastifyRequest['server'],
  request: FastifyRequest<{ Body: SendMessageRequest }>,
  reply: FastifyReply
): Promise<void> {
  const ownerId = readOwnerId(request);
  if (ownerId === null) {
    return reply.badRequest('A valid x-device-id header is required');
  }

  if (!isChatModelConfigured()) {
    return reply.serviceUnavailable('The language model is not configured');
  }

  const text = request.body.text.trim().slice(0, MAX_PROMPT_LENGTH);
  if (text === '') {
    return reply.badRequest('`text` must not be empty');
  }

  const db = this.mongo.db;
  if (db === undefined) {
    return reply.serviceUnavailable('Storage is not available');
  }

  const thread = await resolveThread(db, ownerId, request.body.chatId ?? null, text);
  if (thread === null) {
    return reply.notFound('Chat not found');
  }

  const history = await loadRecentMessages(db, thread._id);

  const now = new Date();
  const turnId = uuidv4();
  const userMessage: MessageDoc = {
    _id: uuidv4(),
    threadId: thread._id,
    userId: ownerId,
    role: 'user',
    text,
    status: 'complete',
    turnId,
    createdAt: now,
    feedback: null,
  };
  const replyMessage: MessageDoc = {
    _id: uuidv4(),
    threadId: thread._id,
    userId: ownerId,
    role: 'assistant',
    text: '',
    status: 'resolving',
    turnId,
    createdAt: new Date(now.getTime() + 1),
    feedback: null,
  };

  await messagesCollection(db).insertMany([userMessage, replyMessage]);
  await touchThread(db, thread._id, replyMessage.createdAt);

  const stream = new ChatEventStream(reply);
  stream.send({
    type: 'turn_started',
    chat: toThreadSummary(thread),
    turnId,
    userMessage: toThreadMessage(userMessage),
    replyMessageId: replyMessage._id,
  });

  try {
    const result = await streamReply({
      systemPrompt: buildPersonaSystemPrompt(),
      history,
      userPrompt: text,
      model: buildChatModel(),
      onDelta: (delta) => stream.send({ type: 'delta', text: delta }),
      shouldStop: () => stream.isClosed,
    });

    const finished: MessageDoc = {
      ...replyMessage,
      text: result.text,
      status: result.interrupted ? 'interrupted' : 'complete',
    };
    await messagesCollection(db).updateOne(
      { _id: replyMessage._id },
      { $set: { text: finished.text, status: finished.status } }
    );
    await touchThread(db, thread._id, new Date());

    stream.send({ type: 'turn_completed', message: toThreadMessage(finished) });
  } catch (error) {
    // The reply row stays `resolving` on purpose — the client is told the turn
    // failed, and a later reload still surfaces the unfinished message rather
    // than pretending it never happened.
    this.log.error(
      { err: error, threadId: thread._id, turnId },
      'Chat turn failed'
    );
    stream.send({
      type: 'turn_failed',
      code: 'model_unavailable',
      message: getErrorMessage(error),
      retryable: true,
    });
  } finally {
    stream.end();
  }
}

/** Load the named thread, or start a new one titled from this first message. */
async function resolveThread(
  db: Db,
  ownerId: string,
  chatId: string | null,
  firstMessage: string
): Promise<ThreadDoc | null> {
  if (chatId !== null) {
    return threadsCollection(db).findOne({ _id: chatId, userId: ownerId });
  }

  const now = new Date();
  const thread: ThreadDoc = {
    _id: uuidv4(),
    userId: ownerId,
    title: deriveThreadTitle(firstMessage),
    createdAt: now,
    updatedAt: now,
    lastMessageAt: now,
  };
  await threadsCollection(db).insertOne(thread);
  return thread;
}

async function loadRecentMessages(db: Db, threadId: string): Promise<ThreadMessage[]> {
  const docs = await messagesCollection(db)
    .find({ threadId })
    .sort({ createdAt: -1 })
    .limit(HISTORY_TURN_LIMIT)
    .toArray();
  return docs.reverse().map(toThreadMessage);
}

async function touchThread(db: Db, threadId: string, at: Date): Promise<void> {
  await threadsCollection(db).updateOne(
    { _id: threadId },
    { $set: { lastMessageAt: at, updatedAt: at } }
  );
}
