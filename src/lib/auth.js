import { getStoredUser } from './api';

export const ADMIN_ROLES = ['league_admin', 'system_admin'];

export function hasAnyRole(user, allowedRoles) {
  const roles = user?.roles || [];
  return allowedRoles.some((role) => roles.includes(role));
}

export function isAdminUser(user) {
  return hasAnyRole(user, ADMIN_ROLES);
}

export function getCurrentUser() {
  return getStoredUser();
}
