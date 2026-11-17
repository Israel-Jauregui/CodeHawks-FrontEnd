import { useEffect, useRef, useState } from 'react';
import type { Photo } from '../constants/photos.generated';

// The photo at the top of an event card. Given more than one photo it becomes a small slideshow:
// every few seconds the next photo loads in over the last, top to bottom in hard bands. The first
// photo is the one prerendered, and the only one shown with reduced motion.
const SLIDE_MS = 5000;

// How wide the card's photo is at each breakpoint in styles.css. With it, the browser picks the
// full-size file over the thumbnail when the thumbnail is too narrow to fill the card sharply,
// as a portrait photo's 420px-tall thumbnail always is.
const SIZES = '(max-width: 620px) 100vw, (max-width: 1100px) 50vw, 440px';

const image = (photo: Photo, slide?: string) => (
  <img
    className="event__photo"
    key={photo.slug}
    src={`/photos/${photo.event}/thumb/${photo.slug}.webp`}
    srcSet={`/photos/${photo.event}/thumb/${photo.slug}.webp ${photo.thumbWidth}w, /photos/${photo.event}/${photo.slug}.webp ${photo.width}w`}
    sizes={SIZES}
    alt={photo.alt}
    width={photo.thumbWidth}
    height={photo.thumbHeight}
    loading="lazy"
    decoding="async"
    data-slide={slide}
  />
);

export default function CardPhotos({ photos }: { photos: Photo[] }) {
  // `before` is the photo the new one loads in over; -1 until the first change.
  const [slide, setSlide] = useState({ now: 0, before: -1 });
  const root = useRef<HTMLDivElement>(null);
  // A ref, not state: pausing on hover should not re-render the card.
  const paused = useRef(false);
  const count = photos.length;

  // Advance on a timer, but only while the card is on screen, the tab is visible and the
  // pointer is not resting on it. Effects run only in the browser, so the prerendered page
  // always starts on the first photo.
  useEffect(() => {
    const element = root.current;
    if (count < 2 || !element || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let onScreen = false;
    const observer = new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; });
    observer.observe(element);
    const timer = setInterval(() => {
      if (onScreen && !paused.current && !document.hidden) setSlide(s => ({ now: (s.now + 1) % count, before: s.now }));
    }, SLIDE_MS);
    return () => {
      clearInterval(timer);
      observer.disconnect();
    };
  }, [count]);

  if (count < 2) return image(photos[0]);

  // Every photo stays in the page, stacked, so each one's alt text is always there to read;
  // the current one is drawn on top. `data-started` holds the load-in animation back until the
  // first change, so the page does not open with one.
  return (
    <div
      className="event__slides"
      ref={root}
      data-started={slide.before >= 0 || undefined}
      onMouseEnter={() => { paused.current = true; }}
      onMouseLeave={() => { paused.current = false; }}
    >
      {photos.map((photo, i) => image(photo, i === slide.now ? 'now' : i === slide.before ? 'before' : undefined))}
    </div>
  );
}
