import { useCallback, useEffect, useState } from 'react';
import { clubDataProvider } from '../services/clubDataProvider';
import type {
  CreateProjectInput,
  CreateProjectResult,
  JoinRequestStatus,
  MemberSummary,
  Project,
} from '../types/clubData';

interface UseProjectsDataResult {
  projects: Project[];
  isLoading: boolean;
  isSaving: boolean;
  isSearchingMembers: boolean;
  isRequestingJoin: boolean;
  error: string | null;
  saveError: string | null;
  joinError: string | null;
  reload: () => Promise<void>;
  addProject: (input: CreateProjectInput) => Promise<CreateProjectResult | null>;
  searchMembers: (query: string) => Promise<MemberSummary[]>;
  requestToJoin: (projectId: string) => Promise<JoinRequestStatus | null>;
}

function messageFrom(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function useProjectsData(): UseProjectsDataResult {
  const [projects, setProjects] = useState<Project[]>([]);
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
      setProjects(await clubDataProvider.getProjects());
    } catch (unknownError) {
      setError(messageFrom(unknownError, 'Unable to load projects right now.'));
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addProject = useCallback(async (input: CreateProjectInput) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const result = await clubDataProvider.createProject(input);
      await loadProjects();
      return result;
    } catch (unknownError) {
      setSaveError(messageFrom(unknownError, 'Unable to save project right now.'));
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

  const requestToJoin = useCallback(async (projectId: string) => {
    setIsRequestingJoin(true);
    setJoinError(null);
    try {
      return await clubDataProvider.requestToJoinProject(projectId);
    } catch (unknownError) {
      setJoinError(messageFrom(unknownError, 'Unable to request to join right now.'));
      return null;
    } finally {
      setIsRequestingJoin(false);
    }
  }, []);

  useEffect(() => { void loadProjects(); }, [loadProjects]);

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
