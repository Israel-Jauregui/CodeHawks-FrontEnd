import { apiRequest, apiRequestPage, type ApiPage } from './apiClient';
import type { Project, Team, ResourceType } from '../types/clubData';

export type ManagedResource = (Project | Team) & { ownerId: string };
export interface Membership {
  resourceId: string;
  resourceType: ResourceType;
  memberId: string;
  memberHandle: string;
  role: string;
  status: string;
}
export interface Invitation {
  resourceId: string;
  resourceType: ResourceType;
  resourceName: string;
  invitedByHandle: string;
}

export function resourcePath(type: ResourceType, id?: string) {
  return `/v1/${type === 'project' ? 'projects' : 'teams'}${id ? `/${encodeURIComponent(id)}` : ''}`;
}

// Follow every cursor: filtered database pages can be empty and still have a next page.
// These private reads deliberately bypass the public listing cache.
export async function readAll<T>(path: string): Promise<T[]> {
  const items: T[] = [];
  let cursor: string | null = null;
  do {
    const page: ApiPage<T> = await apiRequestPage<T>(`${path}${path.includes('?') ? '&' : '?'}limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`, { auth: true });
    items.push(...page.data);
    cursor = page.meta.nextCursor;
  } while (cursor);
  return items;
}

export async function loadManagedResources(type: ResourceType, officer: boolean): Promise<ManagedResource[]> {
  if (officer) return readAll<ManagedResource>(`/v1/manage/${type === 'project' ? 'projects' : 'teams'}`);
  const memberships = await readAll<Membership>(`/v1/me/memberships?resourceType=${type}&status=active`);
  return Promise.all(memberships.filter((membership) => membership.role === 'owner').map((membership) =>
    apiRequest<ManagedResource>(`${resourcePath(type, membership.resourceId)}/manage`, { auth: true })));
}
