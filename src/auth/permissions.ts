import type { ClubRole } from '../types/clubData';

const EVENT_MANAGER_ROLES = new Set<ClubRole>([
  'reservation_designee',
  'vice_president',
  'president',
]);

export function canManageEvents(role: ClubRole | undefined): boolean {
  return role !== undefined && EVENT_MANAGER_ROLES.has(role);
}

export function canManageResources(role: ClubRole | undefined): boolean {
  return role === 'president' || role === 'vice_president' || role === 'treasurer';
}
