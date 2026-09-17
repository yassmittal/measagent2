import type { AvatarProfile } from '@measagent/shared/avatars';
import {
  AudioLines,
  Brain,
  Globe,
  type LucideIcon,
  MessageCircle,
  NotebookPen,
  Sparkles,
} from 'lucide-react';
import { readAvatarCallName } from '@/lib/hero-avatars';

const MAX_CHIPS_PER_STREAM = 4;
const REPLY_WAVE_BARS = 5;

interface SourceChip {
  icon: LucideIcon;
  title: string;
  meta: string;
}

/**
 * What flows into an avatar. The first three are true of every avatar the
 * product makes; the rest are only what these owners chose to make public.
 */
function buildSourceChips(avatars: AvatarProfile[]): SourceChip[] {
  const websites = avatars.flatMap((avatar) =>
    avatar.websiteUrl === null ? [] : [new URL(avatar.websiteUrl).host],
  );
  const topics = avatars.flatMap((avatar) => avatar.askMeAbout);

  return [
    { icon: NotebookPen, title: 'Notes', meta: 'in their own words' },
    { icon: AudioLines, title: 'Voice', meta: 'replies out loud' },
    { icon: Brain, title: 'Memory', meta: 'for signed-in visitors' },
    ...websites.map((host) => ({ icon: Globe, title: host, meta: 'their website' })),
    ...topics.map((topic) => ({ icon: Sparkles, title: topic, meta: 'ask me about' })),
  ].slice(0, MAX_CHIPS_PER_STREAM);
}

type ConversationChip =
  | { kind: 'question'; text: string }
  | { kind: 'reply'; callName: string };

// Examples of what anyone might ask. Nobody's name or words are put on them.
const EXAMPLE_QUESTIONS = [
  'How did you get started?',
  'What would you do in my place?',
  'What are you working on?',
];

/** What flows out of an avatar: a question, then that avatar answering aloud. */
function buildConversationChips(avatars: AvatarProfile[]): ConversationChip[] {
  const callNames = avatars.map(readAvatarCallName);
  return EXAMPLE_QUESTIONS.flatMap((text, index): ConversationChip[] => [
    { kind: 'question', text },
    { kind: 'reply', callName: callNames[index % callNames.length] ?? '' },
  ]).slice(0, MAX_CHIPS_PER_STREAM);
}

function chipStyle(index: number, count: number): React.CSSProperties {
  return { '--chip-index': index, '--chip-count': count } as React.CSSProperties;
}

/**
 * Two streams of chips riding arcs past the portrait: what an avatar is made
 * of drifting in on the left, conversations drifting out on the right.
 * Decoration only — hidden from assistive technology, never focusable.
 */
export function AvatarHeroStreams({ avatars }: { avatars: AvatarProfile[] }) {
  const sources = buildSourceChips(avatars);
  const conversations = buildConversationChips(avatars);

  return (
    <div className="avatar-hero-streams" aria-hidden="true">
      <div className="avatar-hero-stream">
        {sources.map(({ icon: Icon, title, meta }, index) => (
          <div
            key={`${meta}-${title}`}
            className="avatar-hero-chip"
            style={chipStyle(index, sources.length)}
          >
            <Icon className="avatar-hero-chip-icon" size={16} strokeWidth={1.8} />
            <span className="avatar-hero-chip-text">
              <span className="avatar-hero-chip-title">{title}</span>
              <span className="avatar-hero-chip-meta">{meta}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="avatar-hero-stream is-outgoing">
        {conversations.map((chip, index) =>
          chip.kind === 'question' ? (
            <div
              key={`question-${chip.text}`}
              className="avatar-hero-chip"
              style={chipStyle(index, conversations.length)}
            >
              <MessageCircle
                className="avatar-hero-chip-icon"
                size={16}
                strokeWidth={1.8}
              />
              <span className="avatar-hero-chip-question">{chip.text}</span>
            </div>
          ) : (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: one avatar can reply more than once in the stream.
              key={`reply-${index}`}
              className="avatar-hero-chip is-reply"
              style={chipStyle(index, conversations.length)}
            >
              <span className="avatar-hero-chip-reply">{chip.callName} · replying</span>
              <span className="avatar-hero-chip-wave">
                {Array.from({ length: REPLY_WAVE_BARS }, (_, bar) => (
                  <span
                    // biome-ignore lint/suspicious/noArrayIndexKey: identical bars, told apart only by position.
                    key={bar}
                    className="avatar-hero-chip-bar"
                    style={{ '--bar-index': bar } as React.CSSProperties}
                  />
                ))}
              </span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
