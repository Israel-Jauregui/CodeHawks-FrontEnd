import { useCallback, useEffect, useState } from 'react';
import { clubDataProvider } from '../services/clubDataProvider';
import type { CreateTeamInput, CreateTeamResult, Team, TeamJoinStatus } from '../types/clubData';

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function useTeamsData() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setTeams(await clubDataProvider.getTeams());
    } catch (unknownError) {
      setTeams([]);
      setError(errorMessage(unknownError, 'Unable to load teams right now.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createTeam = useCallback(async (input: CreateTeamInput): Promise<CreateTeamResult | null> => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const result = await clubDataProvider.createTeam(input);
      await reload();
      return result;
    } catch (unknownError) {
      setSaveError(errorMessage(unknownError, 'Unable to create the team.'));
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [reload]);

  const joinTeam = useCallback(async (teamId: string): Promise<TeamJoinStatus | null> => {
    setIsJoining(true);
    setJoinError(null);
    try {
      const status = await clubDataProvider.requestToJoinTeam(teamId);
      if (status === 'joined') await reload();
      return status;
    } catch (unknownError) {
      setJoinError(errorMessage(unknownError, 'Unable to join the team.'));
      return null;
    } finally {
      setIsJoining(false);
    }
  }, [reload]);

  useEffect(() => { void reload(); }, [reload]);

  return {
    teams,
    isLoading,
    isSaving,
    isJoining,
    error,
    saveError,
    joinError,
    reload,
    createTeam,
    joinTeam,
  };
}
