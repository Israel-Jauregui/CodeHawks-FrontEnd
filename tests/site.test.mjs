// Run with `npm test`, which builds first. The first group checks the content files;
// the second checks the prerendered page a crawler or a browser without JavaScript gets.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { createServer } from 'vite';

const root = join(import.meta.dirname, '..');
// Load the TypeScript content files the same way the prerender script does.
const vite = await createServer({ root, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const { club } = await vite.ssrLoadModule('/src/constants/club.ts');
const { events } = await vite.ssrLoadModule('/src/constants/events.ts');
const { photos } = await vite.ssrLoadModule('/src/constants/photos.generated.ts');
const { members } = await vite.ssrLoadModule('/src/constants/members.ts');
await vite.close();
const inPublic = path => existsSync(join(root, 'public', path));

test('events have unique slugs and https links', () => {
  assert.equal(new Set(events.map(event => event.slug)).size, events.length);
  for (const event of events) {
    assert.match(event.slug, /^[a-z0-9-]+$/);
    assert.ok(event.summary.length > 0, `${event.slug} needs a summary`);
    if (event.link) assert.match(event.link.href, /^https:\/\//);
    if (event.cover) assert.ok(photos.some(photo => photo.event === event.slug && photo.slug === event.cover), `${event.slug}: cover ${event.cover} is not in its photo folder`);
  }
});

test('members link to LinkedIn profiles and events name only known members', () => {
  for (const [id, member] of Object.entries(members)) {
    assert.ok(member.name.trim(), `${id} needs a name`);
    assert.match(member.linkedin, /^https:\/\/www\.linkedin\.com\/in\/[^/]+\/$/, `${id}: not a LinkedIn profile URL`);
  }
  for (const event of events) {
    for (const id of event.members ?? []) assert.ok(members[id], `${event.slug}: unknown member ${id}`);
    assert.equal(new Set(event.members ?? []).size, (event.members ?? []).length, `${event.slug} lists someone twice`);
  }
});

test('every listed photo has both files, an event and alt text', () => {
  assert.ok(photos.length > 0);
  for (const photo of photos) {
    assert.ok(events.some(event => event.slug === photo.event), `${photo.event} is not an event`);
    assert.ok(inPublic(`photos/${photo.event}/${photo.slug}.webp`), `missing photo ${photo.event}/${photo.slug}`);
    assert.ok(inPublic(`photos/${photo.event}/thumb/${photo.slug}.webp`), `missing thumbnail ${photo.event}/${photo.slug}`);
    assert.ok(photo.alt.trim().length > 10, `${photo.event}/${photo.slug} needs alt text`);
  }
});

test('club links are https', () => {
  for (const url of [club.siteUrl, ...Object.values(club.links)]) assert.match(url, /^https:\/\//);
});

const page = join(root, 'dist/index.html');
const html = existsSync(page) ? readFileSync(page, 'utf8') : '';
const built = { skip: html ? false : 'run `npm run build` first' };
// React leaves empty comments between pieces of text; drop them before reading the words.
const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<!--.*?-->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

test('the page has one h1 with the club name, and its head metadata', built, () => {
  const headings = html.match(/<h1[\s\S]*?<\/h1>/g) ?? [];
  assert.equal(headings.length, 1);
  assert.ok(headings[0].includes('Software Engineering Club @ UNG'));
  assert.match(html, /<title>Software Engineering Club @ UNG \| University of North Georgia<\/title>/);
  assert.match(html, /<link rel="canonical" href="https:\/\/codehawks\.org\/"/);
  const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1] ?? '';
  assert.ok(description.length >= 110 && description.length <= 160, `description is ${description.length} characters`);
  assert.ok(inPublic('og-swe.png') && inPublic('favicon.svg') && inPublic('robots.txt'));
  assert.ok(existsSync(join(root, 'dist/sitemap.xml')));
});

test('the page tells people where to go', built, () => {
  for (const url of [club.links.discord, club.links.connect, club.links.hacklonega, club.links.linkedin, club.links.github]) {
    assert.ok(html.includes(`href="${url}"`), `no link to ${url}`);
  }
  assert.ok(text.includes('Meeting announcements live in Discord and on UNG Connect'));
  assert.ok(html.includes(`mailto:${club.email}`));
});

test('the structured data is valid and points at the club’s other pages', built, () => {
  const block = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(block, 'no JSON-LD block');
  const graph = JSON.parse(block[1])['@graph'];
  const organization = graph.find(node => node['@type'] === 'Organization');
  assert.equal(organization.name, club.name);
  assert.equal(organization.url, club.siteUrl);
  assert.ok(organization.sameAs.includes(club.links.hacklonega));
  assert.ok(graph.some(node => node['@type'] === 'WebSite'));
});

test('nothing in the page breaks the Content Security Policy', built, () => {
  assert.doesNotMatch(html, /\sstyle="/, 'inline style attribute');
  assert.doesNotMatch(html, /<style[\s>]/, 'inline <style>');
  const inlineScripts = (html.match(/<script(?![^>]*\bsrc=)[^>]*>/g) ?? []).filter(tag => !tag.includes('application/ld+json'));
  assert.deepEqual(inlineScripts, []);
  for (const [, url] of html.matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/g)) assert.match(url, /^https:\/\//);
  for (const [, src] of html.matchAll(/<(?:img|script)[^>]*\ssrc="([^"]+)"/g)) assert.match(src, /^\//, `${src} is not served from this site`);
});

test('every image has alt text and a size', built, () => {
  const images = html.match(/<img[^>]*>/g) ?? [];
  assert.ok(images.length > 0);
  for (const image of images) {
    assert.match(image, /\salt="/, image);
    assert.match(image, /\swidth="\d+"/, image);
    assert.match(image, /\sheight="\d+"/, image);
  }
});

test('the old site is gone', built, () => {
  for (const stale of ['CodeHawks at UNG', 'Application Development Club', 'Sign in', 'Windows XP']) {
    assert.ok(!text.includes(stale), `the page still says "${stale}"`);
  }
  // The former names appear once, in the footer line that says they are former.
  assert.equal(text.split('App Development Club').length - 1, 1);
  assert.ok(text.includes('Formerly the App Development Club and CodingWarriors'));
});
