import { mockEvents, mockMembers, mockProjects, mockTeams } from '../data/mockClubData';
import type {
  ClubDataProvider,
  CreateProjectInput,
  JoinRequestStatus,
  Project,
  Team,
  TeamJoinStatus,
  EventRsvpStatus,
} from '../types/clubData';

const LOCAL_FETCH_DELAY_MS = 160;
const PROJECTS_STORAGE_KEY = 'clubWebsite.projects.v2';
const TEAMS_STORAGE_KEY = 'clubWebsite.teams.v2';
const PROJECT_JOIN_REQUESTS_STORAGE_KEY = 'clubWebsite.projectJoinRequests.v2';
const TEAM_JOIN_REQUESTS_STORAGE_KEY = 'clubWebsite.teamJoinRequests.v2';

let cachedProjects: Project[] | null = null;
let cachedTeams: Team[] | null = null;

function readArray<T>(key: string): T[] | null {
  const value = window.localStorage.getItem(key);
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as T[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeArray<T>(key: string, value: T[]) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function getProjectsStore(): Project[] {
  cachedProjects ??= readArray<Project>(PROJECTS_STORAGE_KEY) ?? [...mockProjects];
  return cachedProjects;
}

function getTeamsStore(): Team[] {
  cachedTeams ??= readArray<Team>(TEAMS_STORAGE_KEY) ?? [...mockTeams];
  return cachedTeams;
}

function readJoinRequests(key: string): Record<string, boolean> {
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? '{}') as Record<string, boolean>;
  } catch {
    return {};
  }
}

function writeJoinRequests(key: string, value: Record<string, boolean>) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function simulateLocalFetch<T>(value: T): Promise<T> {
  return new Promise((resolve) => window.setTimeout(() => resolve(value), LOCAL_FETCH_DELAY_MS));
}

function localId(): string {
  return crypto.randomUUID();
}

export const localClubDataProvider: ClubDataProvider = {
  getProjects: async () => simulateLocalFetch([...getProjectsStore()]),

  createProject: async (input: CreateProjectInput) => {
    const timestamp = new Date().toISOString();
    const invitedHandles = mockMembers
      .filter((member) => input.inviteeIds.includes(member.id))
      .map((member) => member.handle);
    const project: Project = {
      id: localId(),
      name: input.name,
      description: input.description,
      ...(input.repoUrl ? { repoUrl: input.repoUrl } : {}),
      ...(input.demoUrl ? { demoUrl: input.demoUrl } : {}),
      techStack: input.techStack,
      status: input.submitForReview ? 'pending_review' : 'draft',
      memberHandles: ['local-demo', ...invitedHandles],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    cachedProjects = [project, ...getProjectsStore()];
    writeArray(PROJECTS_STORAGE_KEY, cachedProjects);
    return simulateLocalFetch({
      project,
      invitationErrors: [],
      ...(input.imageFile
        ? { imageUploadError: 'Local demo mode does not persist uploaded images. The project was saved with its default image.' }
        : {}),
    });
  },

  searchMembers: async (query) => {
    const normalizedQuery = query.trim().toLowerCase();
    const results = normalizedQuery
      ? mockMembers.filter((member) =>
          member.handle.toLowerCase().startsWith(normalizedQuery))
      : [];
    return simulateLocalFetch(results.slice(0, 8));
  },

  requestToJoinProject: async (projectId) => {
    const project = getProjectsStore().find((candidate) => candidate.id === projectId);
    if (!project) throw new Error('Project not found.');
    if (project.memberHandles?.includes('local-demo')) {
      return simulateLocalFetch<JoinRequestStatus>('already-member');
    }
    const requests = readJoinRequests(PROJECT_JOIN_REQUESTS_STORAGE_KEY);
    if (requests[projectId]) return simulateLocalFetch<JoinRequestStatus>('already-requested');
    requests[projectId] = true;
    writeJoinRequests(PROJECT_JOIN_REQUESTS_STORAGE_KEY, requests);
    return simulateLocalFetch<JoinRequestStatus>('requested');
  },

  getTeams: async () => simulateLocalFetch([...getTeamsStore()]),

  createTeam: async (input) => {
    const timestamp = new Date().toISOString();
    const { imageFile, ...teamInput } = input;
    const team: Team = {
      id: localId(),
      ...teamInput,
      status: 'open',
      memberCount: 1,
      memberHandles: ['local-demo'],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    cachedTeams = [team, ...getTeamsStore()];
    writeArray(TEAMS_STORAGE_KEY, cachedTeams);
    return simulateLocalFetch({
      team,
      ...(imageFile
        ? { imageUploadError: 'Local demo mode does not persist uploaded images. The team was saved with its default image.' }
        : {}),
    });
  },

  requestToJoinTeam: async (teamId) => {
    const team = getTeamsStore().find((candidate) => candidate.id === teamId);
    if (!team) throw new Error('Team not found.');
    if (team.memberHandles?.includes('local-demo')) {
      return simulateLocalFetch<TeamJoinStatus>('already-member');
    }
    const requests = readJoinRequests(TEAM_JOIN_REQUESTS_STORAGE_KEY);
    if (requests[teamId]) return simulateLocalFetch<TeamJoinStatus>('already-requested');
    requests[teamId] = true;
    writeJoinRequests(TEAM_JOIN_REQUESTS_STORAGE_KEY, requests);
    return simulateLocalFetch<TeamJoinStatus>(team.joinPolicy === 'open' ? 'joined' : 'requested');
  },

  getEvents: async () => simulateLocalFetch([...mockEvents]),
  getEventRsvp: async (eventId) => {
    const value = window.localStorage.getItem(`clubWebsite.rsvp.${eventId}`);
    return value === 'going' || value === 'maybe' ? value : null;
  },
  setEventRsvp: async (eventId: string, status: EventRsvpStatus) => {
    window.localStorage.setItem(`clubWebsite.rsvp.${eventId}`, status);
  },
};
