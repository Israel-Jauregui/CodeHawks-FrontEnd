import type { MemberId } from './members';

// Where the club has been. One card per event, in the order listed here.
//
// `slug` is also the photo folder: photos-src/<slug>/ in, public/photos/<slug>/ out.
// A card shows its photos when the folder has any and a placeholder panel when it does not.
//
// `when` and `result` are optional. Fill them in when you know them ("October 2026",
// "2nd place, Best Use of AI"); an empty one is simply not shown. Do not guess.
export type ClubEvent = {
  slug: string;
  name: string;
  kind: 'Hackathon' | 'Programming contest';
  // Set on events the club ran itself.
  hosted?: boolean;
  // The photo (its slug) shown on the card. Defaults to the first one in the folder.
  cover?: string;
  // Cycle the card through every photo in the folder, starting from the cover.
  slideshow?: boolean;
  // Club members in the event's photos, from members.ts. The card links each to their LinkedIn.
  members?: MemberId[];
  where?: string;
  when?: string;
  result?: string;
  summary: string;
  link?: { href: string; label: string };
};

export const events: ClubEvent[] = [
  {
    slug: 'hacklonega',
    name: 'Hacklonega',
    kind: 'Hackathon',
    hosted: true,
    cover: 'img-2142',
    where: 'Dahlonega, Georgia',
    when: 'October 24, 2026',
    summary:
      'UNG’s first hackathon, and we ran it. An official Hacktoberfest Hack Day powered by MLH: one Saturday, one building, and students building with open-source AI.',
    link: { href: 'https://hacklonega.dev/', label: 'hacklonega.dev' },
  },
  {
    slug: 'icpc',
    name: 'ICPC',
    kind: 'Programming contest',
    members: ['israel', 'parker', 'collin'],
    summary:
      'The International Collegiate Programming Contest. Teams of three share one computer and race through algorithm problems.',
  },
  {
    slug: 'hackgt',
    name: 'HackGT',
    kind: 'Hackathon',
    where: 'Atlanta, Georgia',
    members: ['david', 'israel'],
    summary: 'Georgia Tech’s hackathon. We drove down, teamed up and built.',
  },
  {
    slug: 'hacklanta',
    name: 'Hacklanta',
    kind: 'Hackathon',
    where: 'Atlanta, Georgia',
    members: ['israel', 'parker'],
    summary: 'A hackathon in Atlanta. Our team built ImagineVR there.',
    link: { href: 'https://github.com/Software-Engineering-Club-UNG/ImagineVR', label: 'ImagineVR on GitHub' },
  },
  {
    slug: 'codelinc',
    name: 'CodeLinc',
    kind: 'Hackathon',
    cover: 'pair-coding',
    slideshow: true,
    members: ['israel', 'parker', 'justin', 'collin'],
    summary: 'A UNG team, a problem statement and a deadline.',
  },
];
