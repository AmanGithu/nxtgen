export type UserRole = 'admin' | 'student' | 'site_user';

/**
 * The server returns roles as ADMIN / STUDENT / SITE_USER; the client works in
 * lowercase throughout. Anything unrecognised is treated as a site user, which
 * is the least-privileged role.
 */
export const normalizeRole = (role?: string | null): UserRole => {
  const normalized = (role || '').toLowerCase();
  return normalized === 'admin' || normalized === 'student' ? normalized : 'site_user';
};

/** Landing route for each role after login. */
export const dashboardPathForRole = (role: UserRole): string => {
  if (role === 'admin') return '/dashboard/admin';
  if (role === 'student') return '/dashboard/student';
  return '/dashboard/tools';
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  student: 'Student',
  site_user: 'Site User',
};
