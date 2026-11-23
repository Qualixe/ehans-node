'use client';

import type { ComponentProps } from 'react';

/** A <select> that submits its form on change (glowy's data-auto-submit). */
export function AutoSubmitSelect(props: ComponentProps<'select'>) {
  return <select {...props} onChange={(e) => e.currentTarget.form?.requestSubmit()} />;
}
