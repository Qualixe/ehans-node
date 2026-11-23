'use client';

import { useActionState, useState } from 'react';
import { type LoginState, signIn } from '@/lib/admin/actions';

const MAIL = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);
const LOCK = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect width="18" height="11" x="3" y="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

/** Sign-in form (glowy auth/admin-login): email, password with Show/Hide, keep me signed in. */
export function LoginForm({ notice }: { notice?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, {
    email: '',
    remember: false,
    errors: {},
  });
  const [show, setShow] = useState(false);

  return (
    <form action={action} noValidate>
      {notice ? (
        <p className="auth-error" role="status" style={{ margin: '0 0 16px', textAlign: 'center' }}>
          {notice}
        </p>
      ) : null}
      <div className="auth-field">
        <label htmlFor="email">Email address</label>
        <div className="auth-input">
          {MAIL}
          <input
            id="email"
            type="email"
            name="email"
            defaultValue={state.email}
            key={`email-${state.email}`}
            placeholder="you@example.com"
            required
            autoFocus
            autoComplete="username"
            aria-invalid={state.errors.email ? 'true' : undefined}
            aria-describedby={state.errors.email ? 'email-error' : undefined}
          />
        </div>
        {state.errors.email ? (
          <p className="auth-error" id="email-error" role="alert">
            {state.errors.email}
          </p>
        ) : null}
      </div>

      <div className="auth-field">
        <label htmlFor="password">Password</label>
        <div className="auth-input">
          {LOCK}
          <input
            id="password"
            type={show ? 'text' : 'password'}
            name="password"
            placeholder="Your password"
            required
            autoComplete="current-password"
            style={{ paddingRight: 70 }}
            aria-invalid={state.errors.password ? 'true' : undefined}
            aria-describedby={state.errors.password ? 'password-error' : undefined}
          />
          <button
            type="button"
            className="auth-toggle"
            aria-controls="password"
            aria-pressed={show}
            onClick={() => setShow((s) => !s)}
          >
            {show ? 'Hide' : 'Show'}
          </button>
        </div>
        {state.errors.password ? (
          <p className="auth-error" id="password-error" role="alert">
            {state.errors.password}
          </p>
        ) : null}
      </div>

      <label className="auth-remember">
        <input type="checkbox" name="remember" value="1" defaultChecked={state.remember} /> Keep me
        signed in
      </label>

      <button type="submit" className="auth-submit" disabled={pending} aria-busy={pending}>
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
