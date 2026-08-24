import type { ClubEvent, MemberLookupSummary, Project, PublicDirectoryMember, Team } from '../types/clubData';

const createdAt = '2026-01-15T17:00:00.000Z';
const updatedAt = '2026-08-01T17:00:00.000Z';

export const mockMembers: Array<MemberLookupSummary & PublicDirectoryMember & { isPublicProfile: boolean }> = [
  ['aidenf', 'Aiden Flores', 'Frontend engineer who loves polished UI interactions.', ['React', 'TypeScript']],
  ['mariac', 'Maria Chen', 'Full-stack builder focused on data visualization.', ['Python', 'React']],
  ['joshk', 'Josh Kim', 'Backend-focused developer and cloud tinkerer.', ['AWS', 'TypeScript']],
  ['natalier', 'Natalie Rivera', 'Mobile and React developer passionate about product UX.', ['React Native', 'Figma']],
  ['ethans', 'Ethan Singh', 'Systems-minded developer and automation enthusiast.', ['Linux', 'Python']],
  ['priyad', 'Priya Desai', 'Product designer/developer hybrid with accessibility focus.', ['Figma', 'CSS']],
].map(([handle, displayName, bio, techStack], index) => ({
  id: `00000000-0000-4000-8000-00000000000${index + 1}`,
  handle: handle as string,
  displayName: displayName as string,
  bio: bio as string,
  githubUrl: `https://github.com/${handle as string}`,
  linkedinUrl: `https://linkedin.com/in/${handle as string}`,
  minors: [],
  techStack: techStack as string[],
  isPublicProfile: index < 2,
}));

export const mockProjects: Project[] = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    name: 'Nighthawk Navigator',
    description: 'A campus wayfinding web app that helps students locate classrooms, labs, and event locations with quick search and map previews.',
    repoUrl: 'https://github.com/UNG-Mobile-App-Development-Club/nighthawk-navigator',
    techStack: ['React', 'TypeScript'],
    status: 'published',
    memberHandles: ['aidenf', 'mariac', 'joshk'],
    createdAt,
    updatedAt,
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    name: 'Study Sprint',
    description: 'A focus-session planner for student teams with shared tasks, countdown timers, and progress check-ins designed for club study nights.',
    repoUrl: 'https://github.com/UNG-Mobile-App-Development-Club/study-sprint',
    techStack: ['React Native', 'Node.js'],
    status: 'published',
    memberHandles: ['natalier', 'priyad', 'ethans'],
    createdAt,
    updatedAt,
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    name: 'Hackathon Hub',
    description: 'An event companion platform for hackathons featuring project board submissions, team matching, and live schedule updates.',
    repoUrl: 'https://github.com/UNG-Mobile-App-Development-Club/hackathon-hub',
    techStack: ['AWS', 'TypeScript', 'React'],
    status: 'published',
    memberHandles: ['mariac', 'ethans', 'aidenf', 'priyad'],
    createdAt,
    updatedAt,
  },
];

export const mockTeams: Team[] = [
  {
    id: '20000000-0000-4000-8000-000000000001',
    name: 'Frontend Squad',
    description: 'Builds polished interfaces and design systems for club projects.',
    category: 'project',
    status: 'open',
    joinPolicy: 'approval_required',
    maxMembers: 6,
    memberCount: 3,
    memberHandles: ['aidenf', 'priyad', 'natalier'],
    createdAt,
    updatedAt,
  },
  {
    id: '20000000-0000-4000-8000-000000000002',
    name: 'Core Platform',
    description: 'Owns backend APIs, deployment, and data workflows.',
    category: 'study_group',
    status: 'open',
    joinPolicy: 'open',
    maxMembers: 8,
    memberCount: 3,
    memberHandles: ['joshk', 'mariac', 'ethans'],
    createdAt,
    updatedAt,
  },
];

export const mockEvents: ClubEvent[] = [
  {
    id: '30000000-0000-4000-8000-000000000001',
    name: 'CodeHawks Weekly Meeting',
    description: 'Discuss ongoing projects, upcoming opportunities, and get help with app ideas and coding challenges.',
    location: 'UNG Dahlonega Campus',
    startsAt: '2026-08-19T17:00:00-04:00',
    endsAt: '2026-08-19T18:00:00-04:00',
    published: true,
    createdAt,
    updatedAt,
  },
  {
    id: '30000000-0000-4000-8000-000000000002',
    name: 'Code and Coffee',
    description: 'A relaxed social coding session for personal projects, peer help, and conversation over coffee.',
    location: 'Cumming Campus Student Lounge',
    startsAt: '2026-08-21T12:00:00-04:00',
    endsAt: '2026-08-21T13:00:00-04:00',
    published: true,
    createdAt,
    updatedAt,
  },
  {
    id: '30000000-0000-4000-8000-000000000003',
    name: 'Fall Project Kickoff',
    description: 'Meet project leads, pitch ideas, and find teammates for the fall build cycle.',
    location: 'Gainesville Campus Nesbitt Building',
    startsAt: '2026-08-26T17:00:00-04:00',
    endsAt: '2026-08-26T18:30:00-04:00',
    published: true,
    createdAt,
    updatedAt,
  },
];
