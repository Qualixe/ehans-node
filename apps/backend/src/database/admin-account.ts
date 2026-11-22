import { hashPassword } from '../modules/auth/password.js';
import { UserRole, type PrismaClient } from '../generated/prisma/client.js';

export const MIN_ADMIN_PASSWORD_LENGTH = 10;

/**
 * Creates the store owner, or resets the name/password of an existing account with that email
 * and makes it the owner. Used by the dev seed and the `admin:create` command.
 */
export async function upsertOwner(
  prisma: PrismaClient,
  input: { email: string; name: string; password: string },
): Promise<{ id: string; created: boolean }> {
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Admin email is not valid');
  if (input.password.length < MIN_ADMIN_PASSWORD_LENGTH) {
    throw new Error(`Admin password must be at least ${MIN_ADMIN_PASSWORD_LENGTH} characters`);
  }
  const passwordHash = await hashPassword(input.password);
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  const data = {
    name: input.name.trim() || 'Store owner',
    passwordHash,
    isAdmin: true,
    role: UserRole.OWNER,
    permissions: undefined,
  };
  if (existing) {
    await prisma.user.update({ where: { id: existing.id }, data });
    // a reset password signs every existing session out
    await prisma.session.deleteMany({ where: { userId: existing.id } });
    return { id: existing.id, created: false };
  }
  const user = await prisma.user.create({ data: { email, ...data } });
  return { id: user.id, created: true };
}
