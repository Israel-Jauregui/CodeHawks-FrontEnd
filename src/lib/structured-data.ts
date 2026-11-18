import { club } from '../constants/club';
import { events, type ClubEvent } from '../constants/events';
import { faq } from '../constants/faq';
import { members, type MemberId } from '../constants/members';
import { photos } from '../constants/photos.generated';

// schema.org data for search engines and AI assistants. Built from the same constants as the page
// so the two cannot drift. The old club names are listed as alternate names so searches for them
// land here, and each member is tied to their LinkedIn so their names lead back to the club.
const organization = `${club.siteUrl}#organization`;
const website = `${club.siteUrl}#website`;
const personId = (id: MemberId) => `${club.siteUrl}#person-${id}`;
const eventId = (event: ClubEvent) => `${club.siteUrl}#event-${event.slug}`;
const memberIds = Object.keys(members) as MemberId[];

const photoUrl = (event: ClubEvent) => {
  const cover = photos.find(photo => photo.event === event.slug && photo.slug === event.cover)
    ?? photos.find(photo => photo.event === event.slug);
  return cover && `${club.siteUrl}photos/${event.slug}/${cover.slug}.webp`;
};

// An event the club went to. Only ones with a date and a place: search engines treat an event
// without a location as broken markup, so an event joins the graph once `where` is filled in.
const attended = events.filter(event => !event.hosted && event.when && event.where);

function attendedEvent(event: ClubEvent) {
  const [city, region] = (event.where ?? '').split(', ');
  return {
    '@type': event.kind === 'Hackathon' ? 'Hackathon' : 'Event',
    '@id': eventId(event),
    name: event.name,
    description: event.summary,
    url: eventId(event),
    image: photoUrl(event),
    startDate: event.when?.start,
    endDate: event.when?.end ?? event.when?.start,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: event.where,
      address: region
        ? { '@type': 'PostalAddress', addressLocality: city, addressRegion: region, addressCountry: 'US' }
        : event.where,
    },
    attendee: [{ '@id': organization }, ...(event.members ?? []).map(id => ({ '@id': personId(id) }))],
  };
}

export function organizationJsonLd() {
  const hacklonega = events.find(event => event.slug === 'hacklonega');
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organization,
        name: club.name,
        legalName: club.longName,
        alternateName: [...club.alternateNames, ...club.formerNames],
        url: club.siteUrl,
        logo: `${club.siteUrl}icon-512.png`,
        image: `${club.siteUrl}og-swe.png`,
        description: club.description,
        slogan: club.mission,
        email: club.email,
        foundingDate: String(club.founded.year),
        knowsAbout: ['Software engineering', 'Hackathons', 'Competitive programming'],
        parentOrganization: {
          '@type': 'CollegeOrUniversity',
          name: club.university,
          url: club.universityUrl,
          sameAs: [...club.universityProfiles],
        },
        location: {
          '@type': 'Place',
          name: `${club.university}, Dahlonega Campus`,
          address: { '@type': 'PostalAddress', addressLocality: 'Dahlonega', addressRegion: 'GA', addressCountry: 'US' },
        },
        member: memberIds.map(id => ({ '@id': personId(id) })),
        event: [
          ...(hacklonega ? [{ '@id': eventId(hacklonega) }] : []),
          ...attended.map(event => ({ '@id': eventId(event) })),
        ],
        sameAs: [club.links.discord, club.links.connect, club.links.linkedin, club.links.github, club.links.hacklonega],
      },
      {
        '@type': 'WebSite',
        '@id': website,
        url: club.siteUrl,
        name: club.name,
        alternateName: club.shortName,
        publisher: { '@id': organization },
      },
      {
        '@type': 'FAQPage',
        '@id': `${club.siteUrl}#faq`,
        url: club.siteUrl,
        isPartOf: { '@id': website },
        about: { '@id': organization },
        mainEntity: faq.map(({ question, answer }) => ({
          '@type': 'Question',
          name: question,
          acceptedAnswer: { '@type': 'Answer', text: answer },
        })),
      },
      ...memberIds.map(id => ({
        '@type': 'Person',
        '@id': personId(id),
        name: members[id].name,
        sameAs: [members[id].linkedin],
        memberOf: { '@id': organization },
      })),
      ...(hacklonega ? [{
        '@type': 'Hackathon',
        '@id': eventId(hacklonega),
        name: hacklonega.name,
        url: club.links.hacklonega,
        image: photoUrl(hacklonega),
        description: 'UNG’s first hackathon, hosted by the Software Engineering Club in Dahlonega, Georgia.',
        // The day comes from events.ts; the hours and the building are this event's own.
        startDate: `${hacklonega.when?.start}T09:00:00-04:00`,
        endDate: `${hacklonega.when?.start}T18:00:00-04:00`,
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        organizer: { '@id': organization },
        location: {
          '@type': 'Place',
          name: `Mike Cottrell College of Business, ${club.university}`,
          address: { '@type': 'PostalAddress', streetAddress: '256 S Chestatee St', addressLocality: 'Dahlonega', addressRegion: 'GA', postalCode: '30533', addressCountry: 'US' },
        },
      }] : []),
      ...attended.map(attendedEvent),
    ],
  };
}
