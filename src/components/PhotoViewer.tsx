import { useEffect, useRef, useState } from 'react';
import type { Photo } from '../constants/photos.generated';
import RetroWindow from './RetroWindow';

// The photo viewer from the Hacklonega countdown screens. Each photo holds for a few seconds,
// then the next one fades in over it.
const PHOTO_MS = 7000;

const source = (photo: Photo) => `/photos/${photo.event}/${photo.slug}.webp`;

// `names` maps an event slug to the name shown in the status bar.
export default function PhotoViewer({ photos, names, start = 0 }: { photos: Photo[]; names: Record<string, string>; start?: number }) {
  // `before` is the photo the current one fades in over; -1 until the first change.
  const [slide, setSlide] = useState({ now: start, before: -1 });
  const [playing, setPlaying] = useState(true);
  const [visible, setVisible] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const photo = photos[slide.now];
  const caption = (shot: Photo) => names[shot.event] ?? shot.event;
  const go = (step: number) => setSlide(s => ({ now: (s.now + step + photos.length) % photos.length, before: s.now }));

  // Only preload and play while the viewer is on screen. Reduced motion starts paused.
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) setPlaying(false);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '200px' });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Fetch the photos on either side ahead of time, so Prev, Next and autoplay fade in a photo
  // that is already loaded instead of one still arriving.
  useEffect(() => {
    if (!visible) return;
    for (const step of [1, -1]) new Image().src = source(photos[(slide.now + step + photos.length) % photos.length]);
  }, [visible, slide.now, photos]);

  useEffect(() => {
    if (!playing || !visible) return;
    const timer = setTimeout(() => go(1), PHOTO_MS);
    return () => clearTimeout(timer);
  }, [playing, visible, slide.now]);

  // The current photo is drawn over the one before it, which stays put until covered.
  // `data-started` holds the fade back until the first change, so the page does not open with one.
  const shown = slide.before >= 0 ? [slide.before, slide.now] : [slide.now];
  return (
    <div className="viewer" ref={root}>
      <RetroWindow
        className="win--viewer"
        title={<><span className="win__dir">C:\CODEHAWKS\PHOTOS\</span>{photo.event.toUpperCase()}\{photo.slug.toUpperCase()}.JPG</>}
        menu={
          <>
            <span aria-hidden="true">File</span>
            <span aria-hidden="true">View</span>
            <span className="win__menu-gap" />
            <button type="button" onClick={() => go(-1)} aria-label="Previous photo">&#9664; Prev</button>
            <button type="button" onClick={() => setPlaying(on => !on)}>{playing ? 'Pause' : 'Play'}</button>
            <button type="button" onClick={() => go(1)} aria-label="Next photo">Next &#9654;</button>
          </>
        }
        status={[caption(photo), `Photo ${slide.now + 1} of ${photos.length}`]}
      >
        <div className="viewer__screen" data-started={slide.before >= 0 || undefined}>
          {shown.map(i => {
            const shot = photos[i];
            const current = i === slide.now;
            return (
              <img
                key={shot.slug}
                src={source(shot)}
                alt={current ? shot.alt : ''}
                aria-hidden={current ? undefined : true}
                width={shot.width}
                height={shot.height}
                loading="lazy"
                decoding="async"
                data-slide={current ? 'now' : 'before'}
              />
            );
          })}
        </div>
      </RetroWindow>
    </div>
  );
}
