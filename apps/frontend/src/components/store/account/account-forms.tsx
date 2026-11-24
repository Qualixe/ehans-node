'use client';

import Link from 'next/link';
import { type InputHTMLAttributes, useActionState, useState } from 'react';
import {
  changePassword,
  type FormState,
  register,
  signIn,
  updateProfile,
} from '@/lib/account/actions';
import { STORE } from '@/lib/store-config';
import { DistrictPicker } from '../checkout/district-picker';
import { QcIcon } from '../checkout/qc-icons';

type Icon = Parameters<typeof QcIcon>[0]['name'];

/** A quick-checkout style field: icon inside the input, label above. */
function Field({
  id,
  label,
  icon,
  optional,
  reveal,
  ...input
}: InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  icon: Icon;
  optional?: boolean;
  /** password fields: a Show / Hide button */
  reveal?: boolean;
}) {
  const [shown, setShown] = useState(false);
  return (
    <div className="qc-field">
      <label htmlFor={id}>
        {label} {optional ? <small>(optional)</small> : null}
      </label>
      <div className="qc-input">
        <QcIcon name={icon} />
        <input id={id} name={id} {...input} type={reveal && shown ? 'text' : input.type} />
        {reveal ? (
          <button
            type="button"
            className="qc-input-toggle"
            aria-controls={id}
            onClick={() => setShown((s) => !s)}
          >
            {shown ? 'Hide' : 'Show'}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function Messages({ state }: { state: FormState }) {
  return (
    <>
      {state.errors.length ? (
        <div className="account-alert" role="alert">
          {state.errors.map((m) => (
            <p key={m}>{m}</p>
          ))}
        </div>
      ) : null}
      {state.saved ? (
        <p className="account-ok" role="status">
          {state.saved}
        </p>
      ) : null}
    </>
  );
}

const EMPTY: FormState = { values: {}, errors: [] };

/** glowy account/login */
export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signIn, EMPTY);
  return (
    <form action={action} className="account-card account-narrow" noValidate>
      <header className="account-head">
        <h1>Sign in</h1>
        <p>Use your mobile number and password to see your orders and check out faster.</p>
      </header>
      <Messages state={state} />
      <input type="hidden" name="next" value={next} />
      <Field
        id="phone"
        label="Mobile number"
        icon="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="01XXXXXXXXX"
        maxLength={20}
        required
        autoFocus
        defaultValue={state.values.phone}
      />
      <Field
        id="password"
        label="Password"
        icon="lock"
        type="password"
        autoComplete="current-password"
        placeholder="Your password"
        required
        reveal
      />
      <label className="account-check">
        <input type="checkbox" name="remember" value="1" defaultChecked /> Keep me signed in
      </label>
      <button type="submit" className="qc-submit" disabled={pending}>
        <b className="qc-submit-label">{pending ? 'Signing in…' : 'Sign in'}</b>
      </button>
      <p className="account-links">
        New here?{' '}
        <Link
          href={`/account/register${next !== '/account' ? `?next=${encodeURIComponent(next)}` : ''}`}
        >
          Create an account
        </Link>
      </p>
      <p className="account-links">
        Forgot your password? Call us at <a href={`tel:${STORE.phone}`}>{STORE.phone}</a> and we
        will reset it for you.
      </p>
    </form>
  );
}

/** glowy account/register */
export function RegisterForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(register, EMPTY);
  return (
    <form action={action} className="account-card account-narrow" noValidate>
      <header className="account-head">
        <h1>Create your account</h1>
        <p>Track every order in one place and check out in seconds.</p>
      </header>
      <Messages state={state} />
      <input type="hidden" name="next" value={next} />
      <Field
        id="name"
        label="Your name"
        icon="user"
        autoComplete="name"
        placeholder="Write your full name"
        maxLength={100}
        required
        autoFocus
        defaultValue={state.values.name}
      />
      <Field
        id="phone"
        label="Mobile number"
        icon="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="01XXXXXXXXX"
        maxLength={20}
        required
        defaultValue={state.values.phone}
      />
      <Field
        id="email"
        label="Email"
        optional
        icon="mail"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        maxLength={120}
        defaultValue={state.values.email}
      />
      <Field
        id="password"
        label="Password"
        icon="lock"
        type="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        minLength={8}
        required
        reveal
      />
      <Field
        id="password_confirmation"
        label="Confirm password"
        icon="lock"
        type="password"
        autoComplete="new-password"
        placeholder="Type it again"
        required
      />
      {/* bots fill every field; people never see this one */}
      <div className="account-honeypot" aria-hidden="true">
        <label htmlFor="fax">Leave this empty</label>
        <input id="fax" name="fax" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <button type="submit" className="qc-submit" disabled={pending}>
        <b className="qc-submit-label">{pending ? 'Creating…' : 'Create account'}</b>
      </button>
      <p className="account-links">
        Already have an account?{' '}
        <Link
          href={`/account/login${next !== '/account' ? `?next=${encodeURIComponent(next)}` : ''}`}
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}

/** glowy account/profile: details + default delivery address */
export function ProfileForm({ initial }: { initial: Record<string, string> }) {
  const [state, action, pending] = useActionState(updateProfile, { values: initial, errors: [] });
  const [district, setDistrict] = useState(initial.district ?? '');
  const v = state.values;
  return (
    <form action={action} className="account-card" noValidate key={state.saved ?? 'form'}>
      <header>
        <h1 className="account-title">Profile &amp; delivery address</h1>
        <p className="account-sub">We use these details to fill in checkout for you.</p>
      </header>
      <Messages state={state} />
      <div className="account-grid-2">
        <Field
          id="name"
          label="Your name"
          icon="user"
          autoComplete="name"
          maxLength={100}
          required
          defaultValue={v.name}
        />
        <Field
          id="phone"
          label="Mobile number"
          icon="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={20}
          required
          defaultValue={v.phone}
        />
      </div>
      <Field
        id="email"
        label="Email"
        optional
        icon="mail"
        type="email"
        autoComplete="email"
        maxLength={120}
        defaultValue={v.email}
      />
      <Field
        id="address"
        label="Default delivery address"
        icon="home"
        autoComplete="street-address"
        placeholder="House, road, area, thana"
        maxLength={500}
        defaultValue={v.address}
      />
      <div className="qc-field">
        <label htmlFor="district">District</label>
        <DistrictPicker id="district" value={district} onChange={setDistrict} />
        <input type="hidden" name="district" value={district} />
      </div>
      <button type="submit" className="qc-submit" disabled={pending}>
        <b className="qc-submit-label">{pending ? 'Saving…' : 'Save details'}</b>
      </button>
    </form>
  );
}

/** glowy account/profile: change password */
export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, EMPTY);
  return (
    <form action={action} className="account-card" noValidate key={state.saved ?? 'form'}>
      <h2 className="account-title">Change password</h2>
      <Messages state={state} />
      <Field
        id="current_password"
        label="Current password"
        icon="lock"
        type="password"
        autoComplete="current-password"
        required
        reveal
      />
      <div className="account-grid-2">
        <Field
          id="password"
          label="New password"
          icon="lock"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <Field
          id="password_confirmation"
          label="Confirm new password"
          icon="lock"
          type="password"
          autoComplete="new-password"
          required
        />
      </div>
      <button type="submit" className="qc-submit secondary" disabled={pending}>
        <b className="qc-submit-label">{pending ? 'Updating…' : 'Update password'}</b>
      </button>
    </form>
  );
}
