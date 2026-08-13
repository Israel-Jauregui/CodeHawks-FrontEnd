export type DataSource = 'local' | 'api';

export type ClubRole =
  | 'member'
  | 'reservation_designee'
  | 'treasurer'
  | 'vice_president'
  | 'president';

export interface MemberSummary {
  id: string;
  handle: string;
  displayName: string;
  role: ClubRole;
  bio?: string;
  avatarUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  major?: string;
  minors: string[];
  techStack: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MemberProfile extends MemberSummary {
  email: string;
  identityProvider: 'entra';
  identitySubject: string;
  identityTenant?: string;
  status: 'active' | 'suspended';
  lastSeenAt: string;
}

export interface MemberProfilePatch {
  displayName?: string;
  bio?: string | null;
  avatarUrl?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  major?: string | null;
  minors?: string[];
  techStack?: string[];
}

export type ProjectStatus = 'draft' | 'pending_review' | 'published' | 'archived';

export interface Project {
  id: string;
  name: string;
  description: string;
  repoUrl?: string;
  imageUrl?: string;
  demoUrl?: string;
  techStack: string[];
  status: ProjectStatus;
  memberHandles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  name: string;
  description: string;
  repoUrl?: string;
  imageUrl?: string;
  demoUrl?: string;
  techStack: string[];
  submitForReview: boolean;
  inviteeIds: string[];
  imageFile?: File;
}

export interface CreateProjectResult {
  project: Project;
  invitationErrors: string[];
  imageUploadError?: string;
}

export type JoinRequestStatus = 'requested' | 'already-member' | 'already-requested';

export type TeamCategory = 'hackathon' | 'ctf' | 'project' | 'study_group' | 'other';
export type TeamStatus = 'open' | 'closed' | 'archived';
export type JoinPolicy = 'open' | 'approval_required';

export interface Team {
  id: string;
  name: string;
  description: string;
  category: TeamCategory;
  status: TeamStatus;
  joinPolicy: JoinPolicy;
  maxMembers: number;
  memberCount: number;
  memberHandles: string[];
  imageUrl?: string;
  eventId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamInput {
  name: string;
  description: string;
  category: TeamCategory;
  joinPolicy: JoinPolicy;
  maxMembers: number;
  imageUrl?: string;
  eventId?: string;
  imageFile?: File;
}

export interface CreateTeamResult {
  team: Team;
  imageUploadError?: string;
}

export type TeamJoinStatus = 'joined' | JoinRequestStatus;

export interface ClubEvent {
  id: string;
  name: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
  imageUrl?: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  archived?: boolean;
}

export type EventRsvpStatus = 'going' | 'maybe';

export type ResourceType = 'project' | 'team';

export interface Notification {
  id: string;
  type:
    | 'resource_join_requested'
    | 'resource_join_withdrawn'
    | 'resource_join_approved'
    | 'resource_join_rejected';
  title: string;
  message: string;
  actorId: string;
  actorHandle: string;
  actorDisplayName: string;
  resourceType: ResourceType;
  resourceId: string;
  resourceName: string;
  createdAt: string;
  readAt?: string;
}

export interface ClubDataProvider {
  getProjects: () => Promise<Project[]>;
  createProject: (input: CreateProjectInput) => Promise<CreateProjectResult>;
  searchMembers: (query: string) => Promise<MemberSummary[]>;
  requestToJoinProject: (projectId: string) => Promise<JoinRequestStatus>;
  getTeams: () => Promise<Team[]>;
  createTeam: (input: CreateTeamInput) => Promise<CreateTeamResult>;
  requestToJoinTeam: (teamId: string) => Promise<TeamJoinStatus>;
  getEvents: () => Promise<ClubEvent[]>;
  setEventRsvp: (eventId: string, status: EventRsvpStatus) => Promise<void>;
}
