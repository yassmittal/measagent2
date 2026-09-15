'use client';

import { useActionState } from 'react';
import { type SignInFormState, signInAction } from '@/app/actions';

const INITIAL_STATE: SignInFormState = { error: null, username: '' };

export function SignInForm() {
  const [state, formAction, isPending] = useActionState(signInAction, INITIAL_STATE);

  return (
    <form className="sign-in-form" action={formAction}>
      <h1 className="sign-in-title">meAsAgent admin</h1>

      <label className="sign-in-field">
        <span>Username</span>
        <input
          name="username"
          defaultValue={state.username}
          autoComplete="username"
          required
        />
      </label>

      <label className="sign-in-field">
        <span>Password</span>
        <input name="password" type="password" autoComplete="current-password" required />
      </label>

      {state.error !== null ? (
        <p className="sign-in-error" role="alert">
          {state.error}
        </p>
      ) : null}

      <button type="submit" className="button-primary" disabled={isPending}>
        {isPending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
