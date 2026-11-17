// Club members named on the page. An event lists the ones in its photos by these ids
// (`members` in events.ts), and its card links each name to that person's LinkedIn.
export const members = {
  israel: { name: 'Israel Jauregui', linkedin: 'https://www.linkedin.com/in/israeljaureguics/' },
  parker: { name: 'Parker Campellone', linkedin: 'https://www.linkedin.com/in/parker-campellone/' },
  collin: { name: 'Collin Perry', linkedin: 'https://www.linkedin.com/in/colinwperry/' },
  justin: { name: 'Justin Perdew', linkedin: 'https://www.linkedin.com/in/justin-perdew/' },
  david: { name: 'David Popescu', linkedin: 'https://www.linkedin.com/in/david-popescu-44330b347/' },
} as const;

export type MemberId = keyof typeof members;
