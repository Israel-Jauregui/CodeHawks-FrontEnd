export type DataSource = 'local' | 'api';

export interface MemberSummary {
  username: string;
  fullname: string;
  profilepicurl?: string | null;
  github?: string | null;
  linkedin?: string | null;
  bio?: string | null;
}

export interface Project {
  projectId: number;
  projectName: string;
  projectDesc: string;
  projectPicsUrl?: string | null;
  repoLink?: string | null;
  memberUsernames: string[];
}

export interface CreateProjectInput {
  projectName: string;
  projectDesc: string;
  projectPicsUrl?: string | null;
  repoLink?: string | null;
  memberUsernames: string[];
}

export type JoinRequestStatus = 'requested' | 'already-member' | 'already-requested';

export interface Team {
  teamId: number;
  teamName: string;
  teamDesc: string;
  maxPeople: number;
  teamPictureUrl?: string | null;
  memberUsernames: string[];
}

export interface ClubDataProvider {
  getProjects: () => Promise<Project[]>;
  createProject: (input: CreateProjectInput) => Promise<Project>;
  searchMembers: (query: string) => Promise<MemberSummary[]>;
  requestToJoinProject: (projectId: number, username: string) => Promise<JoinRequestStatus>;
  getTeams: () => Promise<Team[]>;
  getMembersByUsernames: (usernames: string[]) => Promise<MemberSummary[]>;
}
