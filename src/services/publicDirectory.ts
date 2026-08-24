import { mockMembers } from '../data/mockClubData';
import { isUsingLocalData } from './clubDataProvider';
import { apiRequestPage } from './apiClient';
import type { PublicDirectoryMember } from '../types/clubData';

export async function getPublicDirectoryMembers(): Promise<PublicDirectoryMember[]> {
  if (isUsingLocalData) {
    return mockMembers.filter((member) => member.isPublicProfile).map(({ handle, displayName, bio, avatarUrl, githubUrl, linkedinUrl, major, minors, techStack }) => ({
      handle,
      displayName,
      ...(bio ? { bio } : {}),
      ...(avatarUrl ? { avatarUrl } : {}),
      ...(githubUrl ? { githubUrl } : {}),
      ...(linkedinUrl ? { linkedinUrl } : {}),
      ...(major ? { major } : {}),
      minors,
      techStack,
    }));
  }

  const members: PublicDirectoryMember[] = [];
  let cursor: string | undefined;

  do {
    const page = await apiRequestPage<PublicDirectoryMember>(
      `/v1/directory/members?limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`,
    );
    members.push(...page.data);
    cursor = page.meta.nextCursor ?? undefined;
  } while (cursor);

  return members;
}
