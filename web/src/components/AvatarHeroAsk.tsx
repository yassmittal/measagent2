'use client';

import type { AvatarProfile } from '@measagent/shared/avatars';
import { ArrowUp, LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTypedPlaceholder } from '@/hooks/useTypedPlaceholder';
import { ASK_DRAFT_PARAM } from '@/lib/ask-draft';
import { readAvatarCallName } from '@/lib/hero-avatars';

/**
 * Openers that suit any avatar of its kind. They are examples of what a
 * visitor might ask, not claims about the avatar, so they need nothing from it.
 */
function buildExampleQuestions(avatar: AvatarProfile): string[] {
  if (avatar.subject === 'project') {
    return [
      `What is ${avatar.name}?`,
      'How do I get started?',
      'What makes it different?',
    ];
  }
  return [
    'What are you working on?',
    'How did you get started?',
    'What would you do in my place?',
  ];
}

interface AvatarHeroAskProps {
  avatar: AvatarProfile;
  /** Told whenever the box gains or loses text, so the portrait holds still. */
  onDraftChange: (hasDraft: boolean) => void;
}

/**
 * Still a plain GET form: it works before this component hydrates, and the
 * question only ever lands in the avatar's composer, unsent.
 */
export function AvatarHeroAsk({ avatar, onDraftChange }: AvatarHeroAskProps) {
  const [isFocused, setFocused] = useState(false);
  const [hasText, setHasText] = useState(false);

  const [phrases] = useState(() => [
    `Ask ${readAvatarCallName(avatar)} anything…`,
    ...avatar.askMeAbout.map((topic) => `Ask about ${topic}…`),
    ...buildExampleQuestions(avatar),
  ]);
  const placeholder = useTypedPlaceholder(phrases, isFocused || hasText);

  // The form navigates the whole page, which can take a moment to answer; the
  // send button spins meanwhile. Coming back through the history restores this
  // page as it was left, so the spinner is cleared there.
  const [isSubmitting, setSubmitting] = useState(false);
  useEffect(() => {
    const clearSubmittingOnReturn = (event: PageTransitionEvent) => {
      if (event.persisted) setSubmitting(false);
    };
    window.addEventListener('pageshow', clearSubmittingOnReturn);
    return () => window.removeEventListener('pageshow', clearSubmittingOnReturn);
  }, []);

  return (
    <form
      action={`/${avatar.handle}`}
      method="get"
      className="avatar-hero-ask"
      onSubmit={() => setSubmitting(true)}
    >
      <input
        name={ASK_DRAFT_PARAM}
        className="avatar-hero-ask-input"
        placeholder={placeholder}
        aria-label={`Ask ${avatar.name} a question`}
        autoComplete="off"
        required
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(event) => {
          const hasDraft = event.target.value !== '';
          setHasText(hasDraft);
          onDraftChange(hasDraft);
        }}
      />
      <button
        type="submit"
        className="avatar-hero-ask-send"
        aria-label={isSubmitting ? 'Opening the conversation' : 'Ask'}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <LoaderCircle className="spinner" size={17} aria-hidden="true" />
        ) : (
          <ArrowUp size={17} aria-hidden="true" />
        )}
      </button>
    </form>
  );
}
