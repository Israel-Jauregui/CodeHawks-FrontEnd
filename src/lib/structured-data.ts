import { club } from '../constants/club';

// schema.org data for search engines. Built from the same constants as the page so the two
// cannot drift. The old club names are listed as alternate names so searches for them land here.
export function organizationJsonLd() {
  const organization = `${club.siteUrl}#organization`;
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
        knowsAbout: ['Software engineering', 'Hackathons', 'Competitive programming'],
        parentOrganization: { '@type': 'CollegeOrUniversity', name: club.university, url: club.universityUrl },
        location: {
          '@type': 'Place',
          name: `${club.university}, Dahlonega Campus`,
          address: { '@type': 'PostalAddress', addressLocality: 'Dahlonega', addressRegion: 'GA', addressCountry: 'US' },
        },
        sameAs: [club.links.discord, club.links.connect, club.links.linkedin, club.links.github, club.links.hacklonega],
      },
      {
        '@type': 'WebSite',
        '@id': `${club.siteUrl}#website`,
        url: club.siteUrl,
        name: club.name,
        alternateName: club.shortName,
        publisher: { '@id': organization },
      },
      {
        '@type': 'Hackathon',
        name: 'Hacklonega',
        url: club.links.hacklonega,
        description: 'UNG’s first hackathon, hosted by the Software Engineering Club in Dahlonega, Georgia.',
        startDate: '2026-10-24T09:00:00-04:00',
        endDate: '2026-10-24T18:00:00-04:00',
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        organizer: { '@id': organization },
        location: {
          '@type': 'Place',
          name: `Mike Cottrell College of Business, ${club.university}`,
          address: { '@type': 'PostalAddress', streetAddress: '256 S Chestatee St', addressLocality: 'Dahlonega', addressRegion: 'GA', postalCode: '30533', addressCountry: 'US' },
        },
      },
    ],
  };
}
