// npm run photos
//
// Turns the originals in photos-src/<event>/ into web-ready files and rewrites the photo list
// the site is built from.
//
//   photos-src/<event>/IMG_1234.jpg   in  (git-ignored; never published)
//   public/photos/<event>/img-1234.webp        1280px on the long side
//   public/photos/<event>/thumb/img-1234.webp  420px tall
//   src/constants/photos.generated.ts          the list, with sizes and alt text
//
// Every output is turned upright and re-encoded without metadata, so no camera, date or
// location data is published. <event> must be a slug from src/constants/events.ts.
//
// Alt text comes from photos-src/<event>/captions.json ({ "img-1234": "What the photo shows" }).
// The script adds a line for each new photo; rewrite those lines and run it again.
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

// fileURLToPath, not URL.pathname: pathname keeps spaces as %20, which breaks every path below.
const root = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(root, 'photos-src');
const OUT = join(root, 'public/photos');
const LIST = join(root, 'src/constants/photos.generated.ts');
const FULL = 1280;
const THUMB = 420;
const INPUT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff', '.avif', '.heic', '.heif']);

const slugify = name => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const dirs = async path => existsSync(path)
  ? (await readdir(path, { withFileTypes: true })).filter(entry => entry.isDirectory()).map(entry => entry.name).sort()
  : [];
const newer = async (a, b) => existsSync(b) && (await stat(b)).mtimeMs >= (await stat(a)).mtimeMs;

const eventsSource = await readFile(join(root, 'src/constants/events.ts'), 'utf8');
const eventOrder = [...eventsSource.matchAll(/slug: '([a-z0-9-]+)'/g)].map(match => match[1]);
const eventNames = Object.fromEntries([...eventsSource.matchAll(/slug: '([a-z0-9-]+)',\s*name: '([^']+)'/g)].map(match => [match[1], match[2]]));

// 1. Convert new or changed originals.
let converted = 0;
for (const event of await dirs(SRC)) {
  if (!eventOrder.includes(event)) {
    console.warn(`! photos-src/${event}/ does not match an event slug in src/constants/events.ts. Skipped.`);
    continue;
  }
  const files = (await readdir(join(SRC, event))).filter(file => INPUT.has(extname(file).toLowerCase())).sort();
  await mkdir(join(OUT, event, 'thumb'), { recursive: true });
  for (const file of files) {
    const source = join(SRC, event, file);
    const slug = slugify(basename(file, extname(file)));
    const full = join(OUT, event, `${slug}.webp`);
    const thumb = join(OUT, event, 'thumb', `${slug}.webp`);
    if (await newer(source, full) && await newer(source, thumb)) continue;
    try {
      // rotate() applies the camera's orientation; sharp drops all metadata unless asked to keep it.
      const upright = sharp(source).rotate().toColourspace('srgb');
      await upright.clone().resize({ width: FULL, height: FULL, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toFile(full);
      await upright.clone().resize({ height: THUMB, withoutEnlargement: true }).webp({ quality: 76 }).toFile(thumb);
      converted += 1;
      console.log(`+ ${event}/${slug}`);
    } catch (error) {
      const heic = ['.heic', '.heif'].includes(extname(file).toLowerCase());
      console.error(`! Could not read ${event}/${file}${heic ? '. Export it from Photos as JPEG and try again' : ''}: ${error.message}`);
      process.exitCode = 1;
    }
  }
}

// 2. List what is published, in event order, then by file name.
const photos = [];
const published = (await dirs(OUT)).sort((a, b) => eventOrder.indexOf(a) - eventOrder.indexOf(b));
for (const event of published) {
  if (!eventOrder.includes(event)) {
    console.warn(`! public/photos/${event}/ does not match an event slug. Left out of the list.`);
    continue;
  }
  const captionsFile = join(SRC, event, 'captions.json');
  const captions = existsSync(captionsFile) ? JSON.parse(await readFile(captionsFile, 'utf8')) : {};
  const fallback = `The Software Engineering Club at ${eventNames[event] ?? event}`;
  let added = 0;
  const slugs = (await readdir(join(OUT, event))).filter(file => file.endsWith('.webp')).map(file => basename(file, '.webp')).sort();
  for (const slug of slugs) {
    const thumbFile = join(OUT, event, 'thumb', `${slug}.webp`);
    if (!existsSync(thumbFile)) {
      console.warn(`! ${event}/${slug} has no thumbnail. Left out of the list.`);
      continue;
    }
    if (!captions[slug]) {
      captions[slug] = fallback;
      added += 1;
    }
    const [full, thumb] = await Promise.all([sharp(join(OUT, event, `${slug}.webp`)).metadata(), sharp(thumbFile).metadata()]);
    photos.push({ event, slug, alt: captions[slug], width: full.width, height: full.height, thumbWidth: thumb.width, thumbHeight: thumb.height });
  }
  if (added) {
    await mkdir(join(SRC, event), { recursive: true });
    const sorted = Object.fromEntries(Object.entries(captions).sort(([a], [b]) => a.localeCompare(b)));
    await writeFile(captionsFile, `${JSON.stringify(sorted, null, 2)}\n`);
    console.log(`  ${added} new line(s) in photos-src/${event}/captions.json. Describe each photo there, then run this again.`);
  }
}

const line = photo => `  { event: ${JSON.stringify(photo.event)}, slug: ${JSON.stringify(photo.slug)}, width: ${photo.width}, height: ${photo.height}, thumbWidth: ${photo.thumbWidth}, thumbHeight: ${photo.thumbHeight}, alt: ${JSON.stringify(photo.alt)} },`;
await writeFile(LIST, `// Generated by \`npm run photos\`. Do not edit by hand: change photos-src/<event>/captions.json
// or the files in public/photos/, then run the script again.
export type Photo = { event: string; slug: string; width: number; height: number; thumbWidth: number; thumbHeight: number; alt: string };

export const photos: Photo[] = [
${photos.map(line).join('\n')}
];
`);
console.log(`${converted} converted, ${photos.length} listed in src/constants/photos.generated.ts`);
