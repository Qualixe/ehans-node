'use client';

import { useEffect, useState } from 'react';
import { AdminIcon } from './icon';

const FLASH_COOKIE = 'admin_flash';

/** glowy layout's status message: shown once after a save, fades out after 5 seconds. */
export function Flash({
  message,
}: {
  message: { id: string; text: string; error: boolean } | null;
}) {
  const [hidden, setHidden] = useState<string | null>(null);
  const [fading, setFading] = useState<string | null>(null);

  useEffect(() => {
    if (!message) return;
    // shown: forget it, so a reload doesn't show it again
    document.cookie = `${FLASH_COOKIE}=; Path=/admin; Max-Age=0; SameSite=Lax`;
    const fade = window.setTimeout(() => setFading(message.id), 5000);
    const hide = window.setTimeout(() => setHidden(message.id), 5400);
    return () => {
      window.clearTimeout(fade);
      window.clearTimeout(hide);
    };
  }, [message]);

  if (!message || hidden === message.id) return null;
  return (
    <div
      className={`mb-6 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${message.error ? 'border-rose-500/30 bg-rose-500/10 text-rose-300' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'}`}
      role={message.error ? 'alert' : 'status'}
      style={{ transition: 'opacity .4s', opacity: fading === message.id ? 0 : 1 }}
    >
      <AdminIcon name={message.error ? 'alert' : 'check'} className="size-4 shrink-0" />
      <span>{message.text}</span>
    </div>
  );
}

/** glowy layout's validation box ("Please fix the following"). */
export function FormErrors({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <div
      className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300"
      role="alert"
    >
      <p className="font-semibold">Please fix the following:</p>
      <ul className="mt-1 list-inside list-disc space-y-0.5">
        {errors.map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ul>
    </div>
  );
}

/** glowy's banner for view-only staff (forms are disabled underneath). */
export function ReadOnlyNotice() {
  return (
    <div
      className="mb-6 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300"
      role="note"
    >
      <AdminIcon name="eye" className="size-4 shrink-0" />
      <span>
        <strong>View only.</strong> You can look around this section, but saving, editing and
        deleting are turned off for your account.
      </span>
    </div>
  );
}

/** glowy components/admin/delete-button: confirms, then runs the delete action. */
export function DeleteButton({
  action,
  confirm = 'Delete this item? This cannot be undone.',
  label = 'Delete',
  iconOnly = false,
  disabled = false,
}: {
  action: () => Promise<void>;
  confirm?: string;
  label?: string;
  iconOnly?: boolean;
  disabled?: boolean;
}) {
  return (
    <form
      action={action}
      className="inline"
      onSubmit={(e) => {
        if (!window.confirm(confirm)) e.preventDefault();
      }}
    >
      <button
        type="submit"
        disabled={disabled}
        title={label}
        className={
          iconOnly
            ? 'grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-40'
            : 'admin-btn-danger'
        }
      >
        <AdminIcon name="trash" className="size-4" />
        {iconOnly ? <span className="sr-only">{label}</span> : <span>{label}</span>}
      </button>
    </form>
  );
}
