export type DataSource = 'local' | 'api';

export type ClubRole =
  | 'member'
  | 'reservation_designee'
  | 'treasurer'
  | 'vice_president'
  | 'president';

export interface MemberLookupSummary {
  id: string;
  handle: string;
  displayName: string;
}

export interface MemberProfile {
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
  email: string;
  identityProvider: 'entra' | 'cognito';
  identitySubject: string;
  identityTenant?: string;
  isPublicProfile: boolean;
  newsletterOptIn: boolean;
  status: 'active' | 'suspended';
  lastSeenAt: string;
}

export interface MemberProfilePatch {
  handle?: string;
  displayName?: string;
  isPublicProfile?: boolean;
  newsletterOptIn?: boolean;
  bio?: string | null;
  avatarUrl?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  major?: string | null;
  minors?: string[];
  techStack?: string[];
}

export interface PublicDirectoryMember {
  handle: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  major?: string;
  minors?: string[];
  techStack?: string[];
}

export interface MemberPreferenceAuditEntry {
  id: string;
  actorMemberId: string;
  memberId: string;
  changes: {
    isPublicProfile?: { from: boolean; to: boolean };
    newsletterOptIn?: { from: boolean; to: boolean };
  };
  createdAt: string;
  policyVersion: '2026-08-23-v1';
  source: 'self_service_profile';
}

export interface MemberDataExport {
  generatedAt: string;
  profile: unknown;
  notifications: unknown[];
  invitations: unknown[];
  memberships: unknown[];
  eventRsvps: unknown[];
  preferenceHistory: MemberPreferenceAuditEntry[];
  limitations: string[];
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
  memberHandles?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  name: string;
  description: string;
  repoUrl?: string;
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
  memberHandles?: string[];
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
  searchMembers: (query: string) => Promise<MemberLookupSummary[]>;
  requestToJoinProject: (projectId: string) => Promise<JoinRequestStatus>;
  getTeams: () => Promise<Team[]>;
  createTeam: (input: CreateTeamInput) => Promise<CreateTeamResult>;
  requestToJoinTeam: (teamId: string) => Promise<TeamJoinStatus>;
  getEvents: () => Promise<ClubEvent[]>;
  setEventRsvp: (eventId: string, status: EventRsvpStatus) => Promise<void>;
  getEventRsvp: (eventId: string) => Promise<EventRsvpStatus | null>;
}
