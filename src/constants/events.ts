import type { EventDates } from '../lib/format';
import type { MemberId } from './members';

// Where the club has been. One card per event, in the order listed here.
//
// `slug` is also the photo folder: photos-src/<slug>/ in, public/photos/<slug>/ out.
// A card shows its photos when the folder has any and a placeholder panel when it does not.
//
// `when` and `result` are optional. Fill them in when you know them; an empty one is simply
// not shown. Do not guess. `when` takes ISO dates, `{ start: '2026-10-09', end: '2026-10-11' }`
// (leave out `end` for a one-day event); the card writes them as "October 9–11, 2026" and the
// structured data uses them as they are. `result` is free text: "2nd place, Best Use of AI".
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
  when?: EventDates;
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
    when: { start: '2026-10-24' },
    summary:
      'UNG’s first hackathon, and we ran it. An official Hacktoberfest Hack Day powered by MLH: one Saturday, one building, and students building with open-source AI.',
    link: { href: 'https://hacklonega.dev/', label: 'hacklonega.dev' },
  },
  {
    slug: 'icpc',
    name: 'ICPC',
    kind: 'Programming contest',
    when: { start: '2026-11-07' },
    members: ['israel', 'parker', 'colin'],
    summary:
      'The International Collegiate Programming Contest. Teams of three share one computer and race through algorithm problems.',
  },
  {
    slug: 'hackgt',
    name: 'HackGT',
    kind: 'Hackathon',
    where: 'Atlanta, Georgia',
    when: { start: '2026-09-25', end: '2026-09-27' },
    members: ['david', 'israel'],
    summary: 'Georgia Tech’s hackathon. We drove down, teamed up and built.',
  },
  {
    slug: 'hacklanta',
    name: 'Hacklanta',
    kind: 'Hackathon',
    where: 'Atlanta, Georgia',
    when: { start: '2026-10-09', end: '2026-10-11' },
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
    when: { start: '2026-10-03', end: '2026-10-04' },
    members: ['israel', 'parker', 'justin', 'colin'],
    summary: 'A UNG team, a problem statement and a deadline.',
  },
];
