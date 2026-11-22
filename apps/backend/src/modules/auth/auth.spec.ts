import { LoginThrottle } from './login-throttle.js';
import { DUMMY_PASSWORD_HASH, hashPassword, verifyPassword } from './password.js';
import { effectivePermissions, toAdminUser, type UserAccessRow } from './permissions.js';

const row = (over: Partial<UserAccessRow>): UserAccessRow => ({
  id: 'u1',
  name: 'Rahim Uddin',
  email: 'staff@example.com',
  isAdmin: true,
  role: 'STAFF',
  permissions: null,
  ...over,
});

describe('password hashing', () => {
  it('verifies the right password and rejects others', async () => {
    const hash = await hashPassword('correct horse battery');
    expect(hash.startsWith('scrypt$')).toBe(true);
    await expect(verifyPassword('correct horse battery', hash)).resolves.toBe(true);
    await expect(verifyPassword('wrong password!', hash)).resolves.toBe(false);
  });

  it('salts every hash', async () => {
    expect(await hashPassword('same-password')).not.toBe(await hashPassword('same-password'));
  });

  it('never matches the dummy or malformed hashes', async () => {
    await expect(verifyPassword('anything', DUMMY_PASSWORD_HASH)).resolves.toBe(false);
    await expect(verifyPassword('anything', 'bcrypt$whatever')).resolves.toBe(false);
  });
});

describe('effectivePermissions (glowy User::permissionMap)', () => {
  it('gives the owner every section', () => {
    const p = effectivePermissions(row({ role: 'OWNER' }));
    expect(Object.values(p).every((level) => level === 'manage')).toBe(true);
    expect(Object.keys(p)).toHaveLength(11);
  });

  it('reads the staff map and ignores unknown sections and levels', () => {
    expect(
      effectivePermissions(
        row({ permissions: { orders: 'manage', products: 'view', hacking: 'manage', pos: 'all' } }),
      ),
    ).toEqual({ orders: 'manage', products: 'view' });
  });

  it('treats an old plain list as full access', () => {
    expect(effectivePermissions(row({ permissions: ['orders', 'inventory'] }))).toEqual({
      orders: 'manage',
      inventory: 'manage',
    });
  });

  it('gives non-admins nothing', () => {
    expect(effectivePermissions(row({ isAdmin: false, role: 'OWNER' }))).toEqual({});
  });

  it('maps the role for the API', () => {
    expect(toAdminUser(row({ role: 'OWNER' })).role).toBe('owner');
  });
});

describe('LoginThrottle', () => {
  it('locks a key after 5 failures for the rest of the minute', () => {
    let now = 0;
    const throttle = new LoginThrottle(5, 60_000, () => now);
    for (let i = 0; i < 4; i++) throttle.hit('a@example.com');
    expect(throttle.retryAfter('a@example.com')).toBe(0);
    throttle.hit('a@example.com');
    now = 15_000;
    expect(throttle.retryAfter('a@example.com')).toBe(45);
    expect(throttle.retryAfter('b@example.com')).toBe(0);
    now = 60_000;
    expect(throttle.retryAfter('a@example.com')).toBe(0);
  });

  it('clears on success', () => {
    const throttle = new LoginThrottle(1, 60_000, () => 0);
    throttle.hit('a');
    throttle.clear('a');
    expect(throttle.retryAfter('a')).toBe(0);
  });
});
