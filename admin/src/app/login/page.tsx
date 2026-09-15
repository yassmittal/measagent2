import { SignInForm } from '@/components/SignInForm';

/**
 * Always shows the form, even with a session cookie present: the review page
 * sends an expired session here, and bouncing a cookie that exists but no
 * longer works back to `/` would loop.
 */
export default function LoginPage() {
  return (
    <main className="sign-in-page">
      <SignInForm />
    </main>
  );
}
