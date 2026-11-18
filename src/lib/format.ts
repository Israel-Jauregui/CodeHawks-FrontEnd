// Small text helpers shared by the page, the structured data and llms.txt.

// "A", "A and B", "A, B and C".
export const list = (names: readonly string[]) =>
  names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;

export type EventDates = { start: string; end?: string };

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// "October 24, 2026", "October 9–11, 2026", "September 30 – October 2, 2026".
// Written out by hand rather than with Intl: the server and the browser can ship different
// date data, and a single differing character makes React throw away the prerendered page.
export function formatDates({ start, end }: EventDates) {
  const [y1, m1, d1] = start.split('-').map(Number);
  const month1 = MONTHS[m1 - 1];
  if (!end || end === start) return `${month1} ${d1}, ${y1}`;
  const [y2, m2, d2] = end.split('-').map(Number);
  const month2 = MONTHS[m2 - 1];
  if (y1 !== y2) return `${month1} ${d1}, ${y1} – ${month2} ${d2}, ${y2}`;
  if (m1 !== m2) return `${month1} ${d1} – ${month2} ${d2}, ${y1}`;
  return `${month1} ${d1}–${d2}, ${y1}`;
}
