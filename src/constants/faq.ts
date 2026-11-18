import { list } from '../lib/format';
import { club } from './club';
import { events } from './events';

// What people ask before they join. The page shows these, and the structured data and llms.txt
// repeat them word for word. Search engines and AI assistants quote answers like these, so each
// one should make sense on its own, without the question or the rest of the page.
const hosted = events.filter(event => event.hosted).map(event => event.name);
const attended = events.filter(event => !event.hosted).map(event => event.name);

export const faq: { question: string; answer: string }[] = [
  {
    question: 'Who can join?',
    answer: `Any ${club.university} student, in any major.`,
  },
  {
    question: 'Does it cost anything?',
    answer: 'No. Membership is free.',
  },
  {
    question: 'Do I need coding experience?',
    answer: 'No. You don’t need any coding experience to join. Beginners are welcome.',
  },
  {
    question: 'How do I join?',
    answer: 'Join the club’s Discord or follow it on UNG Connect. Meeting announcements go out on both.',
  },
  {
    question: 'When was the club founded?',
    answer: `The Software Engineering Club was founded in ${club.founded.season.toLowerCase()} ${club.founded.year} at the ${club.university} in ${club.campus}.`,
  },
  {
    question: 'What events does the club do?',
    answer: `It runs ${list(hosted)}, its own hackathon, and sends teams to ${list(attended)}.`,
  },
];
