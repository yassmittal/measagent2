'use client';

import type { UserProfile } from '@measagent/shared';
import {
  AVATAR_HANDLE_PATTERN,
  AVATAR_TEXT_LIMITS,
  type AvatarListing,
  type AvatarPersonaFields,
  type OwnAvatar,
} from '@measagent/shared/avatars';
import Link from 'next/link';
import { type FormEvent, useState } from 'react';
import { launchAvatar, updateOwnAvatar } from '@/lib/avatar-client';
import { SITE_URL } from '@/lib/product';
import { Avatar } from './Avatar';

interface AvatarFormProps {
  owner: UserProfile;
  /** Null until launched: the same form launches and then edits. */
  avatar: OwnAvatar | null;
  onSaved: (avatar: OwnAvatar) => void;
}

type AvatarDraft = AvatarPersonaFields & { handle: string };

const SITE_HOST = new URL(SITE_URL).host;

const LISTING_EXPLANATIONS: Record<AvatarListing, string> = {
  pending:
    'Waiting for review before it appears in the directory. Its link works already.',
  listed: 'Listed in the directory.',
  declined: 'Not listed in the directory. Changing the bio asks for another review.',
};

export function AvatarForm({ owner, avatar, onSaved }: AvatarFormProps) {
  const [draft, setDraft] = useState<AvatarDraft>(() => ({
    handle: avatar?.handle ?? '',
    bio: avatar?.bio ?? '',
    aboutMe: avatar?.aboutMe ?? '',
    speakingStyle: avatar?.speakingStyle ?? '',
    avoidTopics: avatar?.avoidTopics ?? '',
  }));
  const [isSaving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const isLaunched = avatar !== null;

  const updateDraft = (field: keyof AvatarDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setSavedMessage(null);
  };

  const runSave = async (save: () => Promise<OwnAvatar>, successMessage: string) => {
    setSaving(true);
    setErrorMessage(null);
    setSavedMessage(null);
    try {
      onSaved(await save());
      setSavedMessage(successMessage);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'That did not save.');
    } finally {
      setSaving(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { handle, ...personaFields } = draft;

    if (isLaunched) {
      void runSave(() => updateOwnAvatar(personaFields), 'Saved.');
    } else {
      void runSave(
        () => launchAvatar({ handle, ...personaFields, isOwnerAttested: true }),
        'Launched.',
      );
    }
  };

  const toggleAvailability = () => {
    if (avatar === null) return;
    const isPausing = avatar.availability === 'live';
    void runSave(
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
              : 'Nobody can start or continue a conversation with it until you resume it.'}
          </p>
          <button
            type="button"
            className="avatar-form-secondary"
            onClick={toggleAvailability}
            disabled={isSaving}
          >
            {avatar.availability === 'live' ? 'Pause avatar' : 'Resume avatar'}
          </button>
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
              title="3-30 lowercase letters, numbers or hyphens, not starting or ending with a hyphen."
              autoComplete="off"
              spellCheck={false}
              required
            />
          </span>
          <span className="avatar-form-hint">
            Your avatar's link. It cannot be changed later.
          </span>
        </label>
      )}

      <AvatarTextField
        label="Bio"
        hint="Shown to visitors under your name. Changing it sends your avatar back to review."
        value={draft.bio}
        maxLength={AVATAR_TEXT_LIMITS.bio}
        onChange={(value) => updateDraft('bio', value)}
        isRequired
      />
      <AvatarTextField
        label="About you"
        hint="What your avatar knows: your work, interests, what you are building. Only the model reads this."
        value={draft.aboutMe}
        maxLength={AVATAR_TEXT_LIMITS.aboutMe}
        onChange={(value) => updateDraft('aboutMe', value)}
      />
      <AvatarTextField
        label="How you talk"
        hint="Direct or chatty, formal or dry — how your replies should sound."
        value={draft.speakingStyle}
        maxLength={AVATAR_TEXT_LIMITS.speakingStyle}
        onChange={(value) => updateDraft('speakingStyle', value)}
      />
      <AvatarTextField
        label="Topics to avoid"
        hint="Anything your avatar should decline to discuss."
        value={draft.avoidTopics}
        maxLength={AVATAR_TEXT_LIMITS.avoidTopics}
        onChange={(value) => updateDraft('avoidTopics', value)}
      />

      {isLaunched ? null : (
        <label className="avatar-form-attest">
          <input type="checkbox" name="isOwnerAttested" required />
          <span>
            This avatar is of me, {owner.name}. It will say it is an AI whenever it is
            asked.
          </span>
        </label>
      )}

      {errorMessage !== null ? <p className="avatar-form-error">{errorMessage}</p> : null}

      <div className="avatar-form-actions">
        <button type="submit" className="avatar-form-submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : isLaunched ? 'Save changes' : 'Launch avatar'}
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
