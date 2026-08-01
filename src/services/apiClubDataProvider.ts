import type { ClubDataProvider } from '../types/clubData';

function notImplemented(methodName: string): never {
  throw new Error(`${methodName} is not implemented. Switch to local data source for now.`);
}

export const apiClubDataProvider: ClubDataProvider = {
  getProjects: async () => notImplemented('apiClubDataProvider.getProjects'),
  createProject: async () => notImplemented('apiClubDataProvider.createProject'),
  searchMembers: async () => notImplemented('apiClubDataProvider.searchMembers'),
  requestToJoinProject: async () => notImplemented('apiClubDataProvider.requestToJoinProject'),
  getTeams: async () => notImplemented('apiClubDataProvider.getTeams'),
  getMembersByUsernames: async () => notImplemented('apiClubDataProvider.getMembersByUsernames'),
};
