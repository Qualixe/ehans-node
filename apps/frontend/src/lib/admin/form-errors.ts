import { unstable_rethrow } from 'next/navigation';
import { ApiError } from '../api-client';

/**
 * Messages for the form's error box, from an API error (validation lists included).
 * Call it in a server action's catch: Next.js redirects (e.g. an expired session sending
 * the admin to sign-in) are re-thrown instead of being shown as an error.
 */
export function errorMessages(error: unknown): string[] {
  unstable_rethrow(error);
  if (error instanceof ApiError) {
    const message = error.body?.message ?? error.message;
    return Array.isArray(message) ? message : [message];
  }
  return ['Something went wrong while saving. Please try again.'];
}
