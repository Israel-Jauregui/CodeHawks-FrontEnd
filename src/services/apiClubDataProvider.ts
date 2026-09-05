import type {
  ClubDataProvider,
  ClubEvent,
  CreateProjectInput,
  MemberLookupSummary,
  Project,
  Team,
  EventRsvpStatus,
} from '../types/clubData';
import { apiRequest, apiRequestPage } from './apiClient';
import {
  prepareImageForUpload,
  uploadWithPresignedPost,
  type PresignedImageUpload,
} from './mediaUpload';

const CACHE_DURATION_MS = 30_000;
const cache = new Map<string, { expiresAt: number; value: unknown[] }>();

function buildPagePath(path: string, cursor?: string): string {
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
}

async function getAllPages<T>(path: string, auth = false): Promise<T[]> {
  const cached = cache.get(path);
  if (cached && cached.expiresAt > Date.now()) return cached.value as T[];

  const items: T[] = [];
  let cursor: string | undefined;

  do {
    const page = await apiRequestPage<T>(buildPagePath(path, cursor), { auth });
    items.push(...page.data);
    cursor = page.meta.nextCursor ?? undefined;
  } while (cursor);

  cache.set(path, { value: items, expiresAt: Date.now() + CACHE_DURATION_MS });
  return items;
}

function clearCached(path: string) {
  cache.delete(path);
}

export function invalidatePublicResources() {
  cache.clear();
}

async function uploadResourceImage<T extends Project | Team>(
  resourceType: 'project' | 'team',
  resource: T,
  file: File,
): Promise<T> {
  const resourcePath = resourceType === 'project' ? 'projects' : 'teams';
  const prepared = await prepareImageForUpload(file);
  const upload = await apiRequest<PresignedImageUpload>(
    `/v1/${resourcePath}/${encodeURIComponent(resource.id)}/image-upload`,
    {
      method: 'POST',
      auth: true,
      body: { contentType: prepared.file.type, fileSize: prepared.file.size },
    },
  );
  await uploadWithPresignedPost(upload, prepared.file);
  return apiRequest<T>(`/v1/${resourcePath}/${encodeURIComponent(resource.id)}/image-upload/finalize`, {
    method: 'POST',
    auth: true,
    body: { uploadId: upload.uploadId },
  });
}

export const apiClubDataProvider: ClubDataProvider = {
  getProjects: () => getAllPages<Project>('/v1/projects'),

  createProject: async (input: CreateProjectInput) => {
    const { inviteeIds, imageFile, ...projectInput } = input;
    let project = await apiRequest<Project>('/v1/projects', {
      method: 'POST',
      auth: true,
      body: projectInput,
    });

    let imageUploadError: string | undefined;
    if (imageFile) {
      try {
        project = await uploadResourceImage('project', project, imageFile);
      } catch (unknownError) {
        const reason = unknownError instanceof Error
          ? unknownError.message
          : 'The project image could not be uploaded.';
        imageUploadError = `${reason} The project was saved with its default image.`;
      }
    }

    const invitationResults = await Promise.allSettled(
      inviteeIds.map((memberId) => apiRequest<{ status: 'invited' }>(
        `/v1/projects/${encodeURIComponent(project.id)}/invitations`,
        { method: 'POST', auth: true, body: { memberId } },
      )),
    );
    const invitationErrors = invitationResults.flatMap((result) =>
      result.status === 'rejected'
        ? [result.reason instanceof Error ? result.reason.message : 'An invitation could not be sent.']
        : [],
    );

    clearCached('/v1/projects');
    window.dispatchEvent(new Event('club-membership-changed'));
    return {
      project,
      invitationErrors,
      ...(imageUploadError ? { imageUploadError } : {}),
    };
  },

  searchMembers: async (query: string) => {
    const path = `/v1/members?search=${encodeURIComponent(query.trim())}&limit=8`;
    return (await apiRequestPage<MemberLookupSummary>(path, { auth: true })).data;
  },

  requestToJoinProject: async (projectId: string) => {
    const result = await apiRequest<{ status: 'requested' | 'already-member' | 'already-requested' }>(
      `/v1/projects/${encodeURIComponent(projectId)}/join-requests`,
      { method: 'POST', auth: true },
    );
    window.dispatchEvent(new Event('club-membership-changed'));
    return result.status;
  },

  getTeams: () => getAllPages<Team>('/v1/teams'),

  createTeam: async (input) => {
    const { imageFile, ...teamInput } = input;
    let team = await apiRequest<Team>('/v1/teams', {
      method: 'POST',
      auth: true,
      body: teamInput,
    });
    let imageUploadError: string | undefined;
    if (imageFile) {
      try {
        team = await uploadResourceImage('team', team, imageFile);
      } catch (unknownError) {
        const reason = unknownError instanceof Error
          ? unknownError.message
          : 'The team image could not be uploaded.';
        imageUploadError = `${reason} The team was saved with its default image.`;
      }
    }
    clearCached('/v1/teams');
    window.dispatchEvent(new Event('club-membership-changed'));
    return { team, ...(imageUploadError ? { imageUploadError } : {}) };
  },

  requestToJoinTeam: async (teamId) => {
    const result = await apiRequest<{ status: 'joined' | 'requested' | 'already-member' | 'already-requested' }>(
      `/v1/teams/${encodeURIComponent(teamId)}/join-requests`,
      { method: 'POST', auth: true },
    );
    clearCached('/v1/teams');
    window.dispatchEvent(new Event('club-membership-changed'));
    return result.status;
  },

  getEvents: () => getAllPages<ClubEvent>('/v1/events'),

  getEventRsvp: async (eventId) => {
    const rsvp = await apiRequest<{ status: EventRsvpStatus } | null>(
      `/v1/events/${encodeURIComponent(eventId)}/rsvp`, { auth: true },
    );
    return rsvp?.status ?? null;
  },

  setEventRsvp: async (eventId, status) => {
    await apiRequest<void>(`/v1/events/${encodeURIComponent(eventId)}/rsvp`, {
      method: 'PUT',
      auth: true,
      body: { status },
    });
  },
};
