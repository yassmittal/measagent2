import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { AIMessageChunk, BaseMessage } from '@langchain/core/messages';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { ThreadMessage } from '@measagent/shared';

/**
 * Runs one turn against the model and hands back the reply as it arrives.
 *
 * The model is injected rather than constructed here: this module is pure
 * domain logic with no knowledge of Bedrock, env vars or Fastify, which is what
 * makes a turn testable against a stub model.
 */

export interface ReplyRunInput {
  systemPrompt: string;
  /** Prior messages, oldest first. The new prompt is *not* included. */
  history: ThreadMessage[];
  userPrompt: string;
  model: BaseChatModel;
  /** Called for every non-empty token as it streams. */
  onDelta: (delta: string) => void;
  /** Checked between chunks so a disconnected client stops the generation. */
  shouldStop?: () => boolean;
}

export interface ReplyRunResult {
  text: string;
  /** True when generation was cut short rather than reaching a natural end. */
  interrupted: boolean;
}

/**
 * Content may arrive as a plain string or as an array of content parts;
 * only text parts are forwarded.
 */
function chunkText(chunk: AIMessageChunk): string {
  if (typeof chunk.content === 'string') return chunk.content;
  if (!Array.isArray(chunk.content)) return '';
  return chunk.content
    .filter((part) => typeof part === 'object' && part !== null && part.type === 'text')
    .map((part) => (part as { text?: string }).text ?? '')
    .join('');
}

/**
 * An assistant message stored as `resolving` or `interrupted` is a fragment of
 * a reply that never finished. Replaying it as if it were a complete turn
 * teaches the model to truncate, so those are dropped from history.
 */
function toBaseMessages(history: ThreadMessage[]): BaseMessage[] {
  return history
    .filter((message) => message.text !== '')
    .filter((message) => message.role === 'user' || message.status === 'complete')
    .map((message) =>
      message.role === 'user'
        ? new HumanMessage(message.text)
        : new AIMessage(message.text)
    );
}

export async function streamReply(input: ReplyRunInput): Promise<ReplyRunResult> {
  const { systemPrompt, history, userPrompt, model, onDelta, shouldStop } = input;

  const messages: BaseMessage[] = [
    new SystemMessage(systemPrompt),
    ...toBaseMessages(history),
    new HumanMessage(userPrompt),
  ];

  let text = '';
  let interrupted = false;

  const stream = await model.stream(messages);
  for await (const chunk of stream) {
    if (shouldStop?.() === true) {
      interrupted = true;
      break;
    }
    const delta = chunkText(chunk);
    if (delta === '') continue;
    text += delta;
    onDelta(delta);
  }

  return { text, interrupted };
}
