import 'server-only';
import { cookies } from 'next/headers';

/** Cookie carrying a one-time status message to the next admin page (glowy's session flash). */
export const FLASH_COOKIE = 'admin_flash';

/** Call from a server action before redirect(): the next page shows the message once. */
export async function flash(message: string, tone: 'ok' | 'error' = 'ok'): Promise<void> {
  (await cookies()).set(FLASH_COOKIE, encodeURIComponent(`${tone}|${Date.now()}|${message}`), {
    path: '/admin',
    maxAge: 30,
    sameSite: 'lax',
    // cleared by the Flash component in the browser once shown; it holds no secret
    httpOnly: false,
  });
}

export interface FlashMessage {
  id: string;
  text: string;
  error: boolean;
}

/** The pending message (read while rendering the page the action redirected to). */
export async function readFlash(): Promise<FlashMessage | null> {
  const raw = (await cookies()).get(FLASH_COOKIE)?.value;
  if (!raw) return null;
  const [tone, id, ...rest] = decodeURIComponent(raw).split('|');
  if (!id || !rest.length) return null;
  return { id, text: rest.join('|'), error: tone === 'error' };
}
