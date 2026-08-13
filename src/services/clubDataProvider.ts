import { dataSource } from '../config/environment';
import type { ClubDataProvider } from '../types/clubData';
import { apiClubDataProvider } from './apiClubDataProvider';
import { localClubDataProvider } from './localClubDataProvider';

export const isUsingLocalData = dataSource === 'local';

export const clubDataProvider: ClubDataProvider = isUsingLocalData
  ? localClubDataProvider
  : apiClubDataProvider;
