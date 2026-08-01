import { useCallback, useEffect, useState } from 'react';
import { clubDataProvider } from '../services/clubDataProvider';
import type {
  CreateProjectInput,
  JoinRequestStatus,
  MemberSummary,
  Project,
} from '../types/clubData';

export interface ProjectWithMembers extends Project {
  members: MemberSummary[];
}

interface UseProjectsDataResult {
  projects: ProjectWithMembers[];
  isLoading: boolean;
  isSaving: boolean;
  isSearchingMembers: boolean;
  isRequestingJoin: boolean;
  error: string | null;
  saveError: string | null;
  joinError: string | null;
  reload: () => Promise<void>;
  addProject: (input: CreateProjectInput) => Promise<Project | null>;
  searchMembers: (query: string) => Promise<MemberSummary[]>;
  requestToJoin: (projectId: number, username: string) => Promise<JoinRequestStatus | null>;
}

function mapProjectsWithMembers(
  projects: Project[],
  members: MemberSummary[],
): ProjectWithMembers[] {
  const memberByUsername = new Map(members.map((member) => [member.username, member]));

  return projects.map((project) => ({
    ...project,
    members: project.memberUsernames
      .map((username) => memberByUsername.get(username))
      .filter((member): member is MemberSummary => Boolean(member)),
  }));
}

export function useProjectsData(): UseProjectsDataResult {
  const [projects, setProjects] = useState<ProjectWithMembers[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSearchingMembers, setIsSearchingMembers] = useState(false);
  const [isRequestingJoin, setIsRequestingJoin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const rawProjects = await clubDataProvider.getProjects();
      const usernames = Array.from(
        new Set(rawProjects.flatMap((project) => project.memberUsernames)),
      );
      const members = await clubDataProvider.getMembersByUsernames(usernames);

      setProjects(mapProjectsWithMembers(rawProjects, members));
    } catch (unknownError) {
      const message = unknownError instanceof Error
        ? unknownError.message
        : 'Unable to load projects right now.';
      setError(message);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addProject = useCallback(async (input: CreateProjectInput) => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const createdProject = await clubDataProvider.createProject(input);
      await loadProjects();
      return createdProject;
    } catch (unknownError) {
      const message = unknownError instanceof Error
        ? unknownError.message
        : 'Unable to save project right now.';
      setSaveError(message);
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [loadProjects]);

  const searchMembers = useCallback(async (query: string) => {
    setIsSearchingMembers(true);

    try {
      return await clubDataProvider.searchMembers(query);
    } finally {
      setIsSearchingMembers(false);
    }
  }, []);

  const requestToJoin = useCallback(async (projectId: number, username: string) => {
    setIsRequestingJoin(true);
    setJoinError(null);

    try {
      return await clubDataProvider.requestToJoinProject(projectId, username);
    } catch (unknownError) {
      const message = unknownError instanceof Error
        ? unknownError.message
        : 'Unable to request to join right now.';
      setJoinError(message);
      return null;
    } finally {
      setIsRequestingJoin(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  return {
    projects,
    isLoading,
    isSaving,
    isSearchingMembers,
    isRequestingJoin,
    error,
    saveError,
    joinError,
    reload: loadProjects,
    addProject,
    searchMembers,
    requestToJoin,
  };
}
