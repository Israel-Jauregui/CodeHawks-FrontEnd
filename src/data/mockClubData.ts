import type { MemberSummary, Project, Team } from '../types/clubData';

export const mockMembers: MemberSummary[] = [
  {
    username: 'aidenf',
    fullname: 'Aiden Flores',
    github: 'https://github.com/aidenf',
    linkedin: 'https://linkedin.com/in/aidenf',
    bio: 'Frontend engineer who loves polished UI interactions.',
  },
  {
    username: 'mariac',
    fullname: 'Maria Chen',
    github: 'https://github.com/mariac',
    linkedin: 'https://linkedin.com/in/mariac',
    bio: 'Full-stack builder focused on data visualization.',
  },
  {
    username: 'joshk',
    fullname: 'Josh Kim',
    github: 'https://github.com/joshk',
    linkedin: 'https://linkedin.com/in/joshk',
    bio: 'Backend-focused developer and cloud tinkerer.',
  },
  {
    username: 'natalier',
    fullname: 'Natalie Rivera',
    github: 'https://github.com/natalier',
    linkedin: 'https://linkedin.com/in/natalier',
    bio: 'Mobile and React developer passionate about product UX.',
  },
  {
    username: 'ethans',
    fullname: 'Ethan Singh',
    github: 'https://github.com/ethans',
    linkedin: 'https://linkedin.com/in/ethans',
    bio: 'Systems-minded developer and automation enthusiast.',
  },
  {
    username: 'priyad',
    fullname: 'Priya Desai',
    github: 'https://github.com/priyad',
    linkedin: 'https://linkedin.com/in/priyad',
    bio: 'Product designer/developer hybrid with accessibility focus.',
  },
];

export const mockProjects: Project[] = [
  {
    projectId: 101,
    projectName: 'Nighthawk Navigator',
    projectDesc:
      'A campus wayfinding web app that helps students locate classrooms, labs, and event locations with quick search and map previews.',
    projectPicsUrl: null,
    repoLink: 'https://github.com/UNG-Mobile-App-Development-Club/nighthawk-navigator',
    memberUsernames: ['aidenf', 'mariac', 'joshk'],
  },
  {
    projectId: 102,
    projectName: 'Study Sprint',
    projectDesc:
      'A focus-session planner for student teams with shared tasks, countdown timers, and progress check-ins designed for club study nights.',
    projectPicsUrl: null,
    repoLink: 'https://github.com/UNG-Mobile-App-Development-Club/study-sprint',
    memberUsernames: ['natalier', 'priyad', 'ethans'],
  },
  {
    projectId: 103,
    projectName: 'Hackathon Hub',
    projectDesc:
      'An event companion platform for hackathons featuring project board submissions, team matching, and live schedule updates.',
    projectPicsUrl: null,
    repoLink: 'https://github.com/UNG-Mobile-App-Development-Club/hackathon-hub',
    memberUsernames: ['mariac', 'ethans', 'aidenf', 'priyad'],
  },
];

export const mockTeams: Team[] = [
  {
    teamId: 201,
    teamName: 'Frontend Squad',
    teamDesc: 'Builds polished interfaces and design systems for club projects.',
    maxPeople: 6,
    teamPictureUrl: null,
    memberUsernames: ['aidenf', 'priyad', 'natalier'],
  },
  {
    teamId: 202,
    teamName: 'Core Platform',
    teamDesc: 'Owns backend APIs, deployment, and data workflows.',
    maxPeople: 6,
    teamPictureUrl: null,
    memberUsernames: ['joshk', 'mariac', 'ethans'],
  },
];
