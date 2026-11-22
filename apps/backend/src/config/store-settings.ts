/**
 * Store settings that glowy keeps in its `settings` table (Settings screen).
 * Constants until the admin Settings module is ported; same defaults as glowy's config/shop.php.
 */
export const STORE_SETTINGS = {
  /** "live" or "paused" (storefront ordering switched off). */
  status: 'live' as 'live' | 'paused',
  /** Average order value target shown on the dashboard (taka). */
  aovTarget: 1500,
};
