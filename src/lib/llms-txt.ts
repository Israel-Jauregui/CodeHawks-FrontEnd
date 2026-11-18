import { club } from '../constants/club';
import { events } from '../constants/events';
import { faq } from '../constants/faq';
import { members } from '../constants/members';
import { formatDates, list } from './format';

// /llms.txt: the club in plain Markdown, for AI assistants and agents (the llmstxt.org format:
// a title, a one-paragraph summary, then sections of links). Built from the same constants as
// the page, so a new event, date or member shows up here on the next deploy.
export function llmsTxt() {
  const eventLine = (event: (typeof events)[number]) => {
    const facts = [
      event.hosted ? `${event.kind}, hosted by the club` : event.kind,
      event.where,
      event.when && formatDates(event.when),
      event.result,
    ].filter(Boolean).join('. ');
    const people = event.members?.length ? ` Members in the photos: ${list(event.members.map(id => members[id].name))}.` : '';
    const link = event.link ? ` More: [${event.link.label}](${event.link.href}).` : '';
    return `- [${event.name}](${club.siteUrl}#event-${event.slug}): ${facts}. ${event.summary}${people}${link}`;
  };

  return [
    `# ${club.name}`,
    '',
    `> The ${club.longName} (${club.shortName}) is a student organization in ${club.campus}. Members team up for hackathons and programming contests, and the club runs Hacklonega, UNG’s first hackathon. Founded in ${club.founded.season.toLowerCase()} ${club.founded.year}. Free and open to every UNG student; no coding experience needed.`,
    '',
    `Also known as ${list([...club.alternateNames])}. CodeHawks is the website’s domain. Formerly the ${list([...club.formerNames])}. Run by students; not an official university site.`,
    '',
    '## Join',
    '',
    `- [Discord](${club.links.discord}): meeting announcements and club chat`,
    `- [UNG Connect](${club.links.connect}): the club’s listing on UNG’s student organization site`,
    `- Email: ${club.email}, for recruiting or sponsoring`,
    '',
    '## Questions',
    '',
    ...faq.flatMap(({ question, answer }) => [`### ${question}`, '', answer, '']),
    '## Events',
    '',
    ...events.map(eventLine),
    '',
    '## Members',
    '',
    ...Object.values(members).map(member => `- [${member.name}](${member.linkedin}): LinkedIn`),
    '',
    '## Links',
    '',
    `- [Website](${club.siteUrl}): ${club.description}`,
    `- [LinkedIn](${club.links.linkedin}): the club’s LinkedIn page`,
    `- [GitHub](${club.links.github}): club projects`,
    `- [Hacklonega](${club.links.hacklonega}): the club’s hackathon`,
    `- [${club.university}](${club.universityUrl})`,
    '',
  ].join('\n');
}
