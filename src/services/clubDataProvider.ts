import { apiClubDataProvider } from './apiClubDataProvider';
import { localClubDataProvider } from './localClubDataProvider';
import type { ClubDataProvider, DataSource } from '../types/clubData';

const DEFAULT_DATA_SOURCE: DataSource = 'local';

function resolveDataSource(): DataSource {
  const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  const source = viteEnv?.VITE_CLUB_DATA_SOURCE;

  if (source === 'api') {
    return 'api';
  }

  return DEFAULT_DATA_SOURCE;
}

function createClubDataProvider(): ClubDataProvider {
  const dataSource = resolveDataSource();

  if (dataSource === 'api') {
    return apiClubDataProvider;
  }

  return localClubDataProvider;
}

export const clubDataProvider = createClubDataProvider();
