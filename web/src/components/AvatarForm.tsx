'use client';

import type { UserProfile } from '@measagent/shared';
import {
  AVATAR_ASK_ME_ABOUT_MAX_TOPICS,
  AVATAR_HANDLE_PATTERN,
  AVATAR_TEXT_LIMITS,
  AVATAR_WEBSITE_URL_PATTERN,
  type AvatarListing,
  type AvatarPersonaFields,
  type AvatarSubject,
  type OwnAvatar,
} from '@measagent/shared/avatars';
import Link from 'next/link';
import { type FormEvent, useState } from 'react';
import { launchAvatar, updateOwnAvatar } from '@/lib/avatar-client';
import { CONTACT_EMAIL, SITE_URL } from '@/lib/product';
import { Avatar } from './Avatar';
import { BusyButtonLabel } from './BusyButtonLabel';

/** Which of the form's buttons started the save now running, so only that one spins. */
type AvatarSaveAction = 'save' | 'toggle-availability';

interface AvatarFormProps {
  owner: UserProfile;
  /** Null until launched: the same form launches and then edits. */
  avatar: OwnAvatar | null;
  onSaved: (avatar: OwnAvatar) => void;
}

type AvatarTextDraft = AvatarPersonaFields & {
  handle: string;
  /** Comma-separated as typed; split into topics when saved. */
  askMeAboutText: string;
  websiteUrl: string;
};

interface AvatarDraft extends AvatarTextDraft {
  subject: AvatarSubject;
  isShownInSearch: boolean;
}

const ASK_ME_ABOUT_SEPARATOR = ',';

function splitAskMeAboutTopics(askMeAboutText: string): string[] {
  return askMeAboutText
    .split(ASK_ME_ABOUT_SEPARATOR)
    .map((topic) => topic.trim())
    .filter((topic) => topic !== '')
    .slice(0, AVATAR_ASK_ME_ABOUT_MAX_TOPICS);
}

const SITE_HOST = new URL(SITE_URL).host;

const LISTING_EXPLANATIONS: Record<AvatarListing, string> = {
  listed: 'It’s on the front page too.',
  pending: 'Save once more to add it to the front page.',
  declined: `We took it off the front page, but its link still works. If you think that’s a mistake, email ${CONTACT_EMAIL}.`,
};

export function AvatarForm({ owner, avatar, onSaved }: AvatarFormProps) {
  const [draft, setDraft] = useState<AvatarDraft>(() => ({
    handle: avatar?.handle ?? '',
    bio: avatar?.bio ?? '',
    aboutMe: avatar?.aboutMe ?? '',
    speakingStyle: avatar?.speakingStyle ?? '',
    avoidTopics: avatar?.avoidTopics ?? '',
    askMeAboutText: avatar?.askMeAbout.join(`${ASK_ME_ABOUT_SEPARATOR} `) ?? '',
    websiteUrl: avatar?.websiteUrl ?? '',
    subject: avatar?.subject ?? 'person',
    isShownInSearch: !(avatar?.isHiddenFromSearch ?? false),
  }));
  const [runningSaveAction, setRunningSaveAction] = useState<AvatarSaveAction | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const isLaunched = avatar !== null;
  const isSaving = runningSaveAction !== null;
  const isSubmitting = runningSaveAction === 'save';
  const submitLabel = isSubmitting
    ? 'Saving…'
    : isLaunched
      ? 'Save changes'
      : 'Launch avatar';

  const updateDraft = <Field extends keyof AvatarDraft>(
    field: Field,
    value: AvatarDraft[Field],
  ) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setSavedMessage(null);
  };

  const runSave = async (
    saveAction: AvatarSaveAction,
    save: () => Promise<OwnAvatar>,
    successMessage: string,
  ) => {
    setRunningSaveAction(saveAction);
    setErrorMessage(null);
    setSavedMessage(null);
    try {
      onSaved(await save());
      setSavedMessage(successMessage);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'That didn’t save. Try again.',
      );
    } finally {
      setRunningSaveAction(null);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { handle, askMeAboutText, isShownInSearch, ...editableFields } = draft;
    const avatarFields = {
      ...editableFields,
      askMeAbout: splitAskMeAboutTopics(askMeAboutText),
      isHiddenFromSearch: !isShownInSearch,
    };

    if (isLaunched) {
      void runSave('save', () => updateOwnAvatar(avatarFields), 'Saved.');
    } else {
      void runSave(
        'save',
        () => launchAvatar({ handle, ...avatarFields, isOwnerAttested: true }),
        'Your avatar is live.',
      );
    }
  };

  const toggleAvailability = () => {
    if (avatar === null) return;
    const isPausing = avatar.availability === 'live';
    void runSave(
      'toggle-availability',
      () => updateOwnAvatar({ availability: isPausing ? 'paused' : 'live' }),
      isPausing ? 'Paused.' : 'Live again.',
    );
  };

  return (
    <form className="avatar-form" onSubmit={submit}>
      <div className="avatar-form-identity">
        <Avatar portraitUrl={owner.pictureUrl} size={56} />
        <span className="avatar-form-identity-text">
          <span className="avatar-form-identity-name">{owner.name}</span>
          <span className="avatar-form-hint">From your Google account.</span>
        </span>
      </div>

      {avatar !== null ? (
        <section className="avatar-form-status">
          <p className="avatar-form-status-line">
            <strong>{avatar.availability === 'live' ? 'Live' : 'Paused'}</strong>
            {' at '}
            <Link href={`/${avatar.handle}`}>
              {SITE_HOST}/{avatar.handle}
            </Link>
          </p>
          <p className="avatar-form-hint">
            {avatar.availability === 'live'
              ? LISTING_EXPLANATIONS[avatar.listing]
              : 'Nobody can chat with it until you turn it back on.'}
          </p>
          <button
            type="button"
            className="avatar-form-secondary"
            onClick={toggleAvailability}
            disabled={isSaving}
          >
            <BusyButtonLabel isBusy={runningSaveAction === 'toggle-availability'}>
              {avatar.availability === 'live' ? 'Pause avatar' : 'Turn avatar back on'}
            </BusyButtonLabel>
          </button>
          <Link href="/launch/visitors" className="avatar-form-visitors">
            See who talks to your avatar
          </Link>
        </section>
      ) : (
        <label className="avatar-form-field">
          <span className="avatar-form-label">Handle</span>
          <span className="avatar-form-handle">
            <span className="avatar-form-handle-prefix">{SITE_HOST}/</span>
            <input
              className="avatar-form-handle-input"
              name="handle"
              value={draft.handle}
              onChange={(event) =>
                updateDraft('handle', event.target.value.toLowerCase())
              }
              pattern={AVATAR_HANDLE_PATTERN}
              title="3 to 30 lowercase letters, numbers or hyphens. It can’t start or end with a hyphen."
              autoComplete="off"
              spellCheck={false}
              required
            />
          </span>
          <span className="avatar-form-hint">
            Your avatar’s link. You can’t change it later.
          </span>
        </label>
      )}

      <fieldset className="avatar-form-choices">
        <legend className="avatar-form-label">This avatar is of</legend>
        <label className="avatar-form-choice">
          <input
            type="radio"
            name="subject"
            value="person"
            checked={draft.subject === 'person'}
            onChange={() => updateDraft('subject', 'person')}
          />
          <span>Me</span>
        </label>
        <label className="avatar-form-choice">
          <input
            type="radio"
            name="subject"
            value="project"
            checked={draft.subject === 'project'}
            onChange={() => updateDraft('subject', 'project')}
          />
          <span>Something I run, like a product, project or brand</span>
        </label>
      </fieldset>

      <AvatarTextField
        label="Bio"
        hint="Shown under your name on your page."
        value={draft.bio}
        maxLength={AVATAR_TEXT_LIMITS.bio}
        onChange={(value) => updateDraft('bio', value)}
        isRequired
      />
      <label className="avatar-form-field">
        <span className="avatar-form-label">Ask me about</span>
        <input
          className="avatar-form-input"
          name="askMeAbout"
          value={draft.askMeAboutText}
          onChange={(event) => updateDraft('askMeAboutText', event.target.value)}
          placeholder="Hiring, our roadmap, getting started"
          maxLength={
            (AVATAR_TEXT_LIMITS.askMeAboutTopic + 2) * AVATAR_ASK_ME_ABOUT_MAX_TOPICS
          }
        />
        <span className="avatar-form-hint">
          Optional. Up to {AVATAR_ASK_ME_ABOUT_MAX_TOPICS} short topics, separated by
          commas. Shown on your page.
        </span>
      </label>

      <label className="avatar-form-field">
        <span className="avatar-form-label">Your website</span>
        <input
          className="avatar-form-input"
          name="websiteUrl"
          type="url"
          inputMode="url"
          value={draft.websiteUrl}
          onChange={(event) => updateDraft('websiteUrl', event.target.value.trim())}
          placeholder="https://"
          pattern={AVATAR_WEBSITE_URL_PATTERN}
          title="A full link starting with https://"
          maxLength={AVATAR_TEXT_LIMITS.websiteUrl}
          autoComplete="url"
          spellCheck={false}
        />
        <span className="avatar-form-hint">Optional. Linked from your page.</span>
      </label>

      <AvatarTextField
        label="About you"
        hint="What your avatar knows: your work, your interests, what you’re building. Only the AI reads this."
        value={draft.aboutMe}
        maxLength={AVATAR_TEXT_LIMITS.aboutMe}
        onChange={(value) => updateDraft('aboutMe', value)}
      />
      <AvatarTextField
        label="How you talk"
        hint="How your replies should sound. Short or chatty, formal or relaxed."
        value={draft.speakingStyle}
        maxLength={AVATAR_TEXT_LIMITS.speakingStyle}
        onChange={(value) => updateDraft('speakingStyle', value)}
      />
      <AvatarTextField
        label="Topics to avoid"
        hint="Anything your avatar shouldn’t talk about."
        value={draft.avoidTopics}
        maxLength={AVATAR_TEXT_LIMITS.avoidTopics}
        onChange={(value) => updateDraft('avoidTopics', value)}
      />

      <label className="avatar-form-toggle">
        <input
          type="checkbox"
          name="isShownInSearch"
          checked={draft.isShownInSearch}
          onChange={(event) => updateDraft('isShownInSearch', event.target.checked)}
        />
        <span>
          Show my avatar on Google and other search engines.
          <span className="avatar-form-toggle-hint">
            Turn this off to keep your page out of search results. The link still works.
          </span>
        </span>
      </label>

      {isLaunched ? null : (
        <label className="avatar-form-attest">
          <input type="checkbox" name="isOwnerAttested" required />
          <span>
            {draft.subject === 'person'
              ? `This avatar is of me, ${owner.name}.`
              : 'I run what this avatar speaks for, and I’m launching it from my own account. It isn’t another person.'}{' '}
            It will say it’s an AI whenever someone asks.
          </span>
        </label>
      )}

      {errorMessage !== null ? <p className="avatar-form-error">{errorMessage}</p> : null}

      <div className="avatar-form-actions">
        <button type="submit" className="avatar-form-submit" disabled={isSaving}>
          <BusyButtonLabel isBusy={isSubmitting}>{submitLabel}</BusyButtonLabel>
        </button>
        {savedMessage !== null ? (
          <span className="avatar-form-saved" role="status">
            {savedMessage}
          </span>
        ) : null}
      </div>
    </form>
  );
}

interface AvatarTextFieldProps {
  label: string;
  hint: string;
  value: string;
  maxLength: number;
  onChange: (value: string) => void;
  isRequired?: boolean;
}

function AvatarTextField({
  label,
  hint,
  value,
  maxLength,
  onChange,
  isRequired = false,
}: AvatarTextFieldProps) {
  return (
    <label className="avatar-form-field">
      <span className="avatar-form-label">
        {label}
        <span className="avatar-form-count">
          {value.length}/{maxLength}
        </span>
      </span>
      <textarea
        className="avatar-form-textarea"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={maxLength}
        required={isRequired}
        rows={maxLength > AVATAR_TEXT_LIMITS.bio ? 5 : 3}
      />
      <span className="avatar-form-hint">{hint}</span>
    </label>
  );
}
