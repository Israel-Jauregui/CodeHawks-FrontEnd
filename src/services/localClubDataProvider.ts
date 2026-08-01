import { mockMembers, mockProjects, mockTeams } from '../data/mockClubData';
import type {
  ClubDataProvider,
  CreateProjectInput,
  JoinRequestStatus,
  Project,
} from '../types/clubData';

const LOCAL_FETCH_DELAY_MS = 220;
const PROJECTS_STORAGE_KEY = 'clubWebsite.projects.v1';
const PROJECT_JOIN_REQUESTS_STORAGE_KEY = 'clubWebsite.projectJoinRequests.v1';

let cachedProjects: Project[] | null = null;

function readProjectsFromStorage(): Project[] | null {
  const storedProjects = window.localStorage.getItem(PROJECTS_STORAGE_KEY);

  if (!storedProjects) {
    return null;
  }

  try {
    const parsedProjects = JSON.parse(storedProjects) as Project[];
    return Array.isArray(parsedProjects) ? parsedProjects : null;
  } catch {
    return null;
  }
}

function writeProjectsToStorage(projects: Project[]) {
  window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
}

function getProjectsStore(): Project[] {
  if (cachedProjects) {
    return cachedProjects;
  }

  const storedProjects = readProjectsFromStorage();

  if (storedProjects && storedProjects.length > 0) {
    cachedProjects = storedProjects;
    return cachedProjects;
  }

  cachedProjects = [...mockProjects];
  writeProjectsToStorage(cachedProjects);
  return cachedProjects;
}

function getNextProjectId(projects: Project[]): number {
  if (projects.length === 0) {
    return 1;
  }

  return Math.max(...projects.map((project) => project.projectId)) + 1;
}

function readJoinRequestsFromStorage(): Record<string, string[]> {
  const serialized = window.localStorage.getItem(PROJECT_JOIN_REQUESTS_STORAGE_KEY);

  if (!serialized) {
    return {};
  }

  try {
    const parsed = JSON.parse(serialized) as Record<string, string[]>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeJoinRequestsToStorage(value: Record<string, string[]>) {
  window.localStorage.setItem(PROJECT_JOIN_REQUESTS_STORAGE_KEY, JSON.stringify(value));
}

function simulateLocalFetch<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), LOCAL_FETCH_DELAY_MS);
  });
}

export const localClubDataProvider: ClubDataProvider = {
  getProjects: async () => simulateLocalFetch([...getProjectsStore()]),

  createProject: async (input: CreateProjectInput) => {
    const projects = getProjectsStore();

    const createdProject: Project = {
      projectId: getNextProjectId(projects),
      projectName: input.projectName,
      projectDesc: input.projectDesc,
      projectPicsUrl: input.projectPicsUrl ?? null,
      repoLink: input.repoLink ?? null,
      memberUsernames: input.memberUsernames,
    };

    cachedProjects = [createdProject, ...projects];
    writeProjectsToStorage(cachedProjects);

    return simulateLocalFetch(createdProject);
  },

  searchMembers: async (query) => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return simulateLocalFetch([]);
    }

    const members = mockMembers.filter((member) => {
      return (
        member.username.toLowerCase().includes(normalizedQuery)
        || member.fullname.toLowerCase().includes(normalizedQuery)
      );
    });

    return simulateLocalFetch(members.slice(0, 8));
  },

  requestToJoinProject: async (projectId, username) => {
    const projects = getProjectsStore();
    const targetProject = projects.find((project) => project.projectId === projectId);

    if (!targetProject) {
      throw new Error('Project not found.');
    }

    if (targetProject.memberUsernames.includes(username)) {
      return simulateLocalFetch<JoinRequestStatus>('already-member');
    }

    const joinRequestsByProject = readJoinRequestsFromStorage();
    const projectKey = String(projectId);
    const existingRequests = joinRequestsByProject[projectKey] ?? [];

    if (existingRequests.includes(username)) {
      return simulateLocalFetch<JoinRequestStatus>('already-requested');
    }

    joinRequestsByProject[projectKey] = [...existingRequests, username];
    writeJoinRequestsToStorage(joinRequestsByProject);

    return simulateLocalFetch<JoinRequestStatus>('requested');
  },

  getTeams: async () => simulateLocalFetch(mockTeams),

  getMembersByUsernames: async (usernames) => {
    const uniqueUsernames = new Set(usernames);
    const members = mockMembers.filter((member) => uniqueUsernames.has(member.username));
    return simulateLocalFetch(members);
  },
};
