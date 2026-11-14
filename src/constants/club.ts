// Every fact about the club that the page, the metadata and the structured data share.
// Change a name or a link here and it changes everywhere.
export const club = {
  name: 'Software Engineering Club @ UNG',
  // How the name reads in a sentence ("the Software Engineering Club at ...").
  longName: 'Software Engineering Club at the University of North Georgia',
  shortName: 'SWE',
  alternateNames: ['SWE', 'SWE Club', 'UNG Software Engineering Club', 'CodeHawks'],
  // The two clubs that merged into this one. Shown once in the footer and listed in the
  // structured data so people searching the old names find the new club.
  formerNames: ['App Development Club', 'CodingWarriors'],
  mission: 'Putting UNG on the map.',
  description:
    'UNG’s Software Engineering Club in Dahlonega, Georgia. Students team up for hackathons and programming contests and build a CS community on campus. Join us.',
  university: 'University of North Georgia',
  universityUrl: 'https://ung.edu/',
  campus: 'Dahlonega, Georgia',
  siteUrl: 'https://codehawks.org/',
  email: 'contact@codehawks.org',
  links: {
    discord: 'https://discord.gg/RQ6xCMpRQm',
    // The listing still has the old club's slug; it is the Software Engineering Club's page.
    connect: 'https://connect.ung.edu/organization/app-development-club-of-ung--dah-',
    linkedin: 'https://www.linkedin.com/company/swe-at-ung/',
    github: 'https://github.com/Software-Engineering-Club-UNG',
    hacklonega: 'https://hacklonega.dev/',
  },
} as const;
