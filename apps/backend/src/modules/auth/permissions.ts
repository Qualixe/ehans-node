import {
  ADMIN_SECTIONS,
  type AccessLevel,
  type AdminPermissions,
  type AdminSection,
  type AdminUser,
} from '@ehans/shared';

/** Fields of the `users` row the permission rules need. */
export interface UserAccessRow {
  id: string;
  name: string;
  email: string | null;
  isAdmin: boolean;
  role: 'OWNER' | 'STAFF' | null;
  permissions: unknown;
}

const isSection = (value: unknown): value is AdminSection =>
  typeof value === 'string' && (ADMIN_SECTIONS as readonly string[]).includes(value);

/**
 * Effective { section: level } map, as glowy's User::permissionMap():
 * the owner manages everything; staff get their stored map (an older plain list of
 * sections means full access to those); non-admins get nothing.
 */
export function effectivePermissions(user: UserAccessRow): AdminPermissions {
  if (!user.isAdmin || !user.role) return {};
  if (user.role === 'OWNER') {
    return Object.fromEntries(ADMIN_SECTIONS.map((s) => [s, 'manage' as const]));
  }
  const stored = user.permissions;
  const map: AdminPermissions = {};
  if (Array.isArray(stored)) {
    for (const s of stored) if (isSection(s)) map[s] = 'manage';
  } else if (stored && typeof stored === 'object') {
    for (const [s, level] of Object.entries(stored)) {
      if (isSection(s) && (level === 'view' || level === 'manage')) map[s] = level as AccessLevel;
    }
  }
  return map;
}

export function toAdminUser(user: UserAccessRow): AdminUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role === 'OWNER' ? 'owner' : 'staff',
    permissions: effectivePermissions(user),
  };
}
