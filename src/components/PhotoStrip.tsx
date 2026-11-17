import { useEffect, useRef } from 'react';
import type { Photo } from '../constants/photos.generated';

// The photo strip from the Hacklonega countdown screens: cards that slowly scroll past.
// The list is rendered twice so the loop is seamless; the copy is hidden from assistive technology.
export default function PhotoStrip({ photos, names }: { photos: Photo[]; names: Record<string, string> }) {
  const track = useRef<HTMLDivElement>(null);

  // Keep the pace the same however many photos there are. Set from script because the
  // site's Content Security Policy does not allow style attributes in the page itself.
  useEffect(() => {
    track.current?.style.setProperty('--strip-seconds', `${Math.max(60, photos.length * 15)}s`);
  }, [photos.length]);

  return (
    <div className="strip">
      <div className="strip__track" ref={track}>
        {[...photos, ...photos].map((photo, i) => {
          const copy = i >= photos.length;
          return (
            <figure className="strip__card" key={`${photo.event}-${photo.slug}-${i}`} data-copy={copy || undefined} aria-hidden={copy || undefined}>
              <img src={`/photos/${photo.event}/thumb/${photo.slug}.webp`} alt={copy ? '' : photo.alt} width={photo.thumbWidth} height={photo.thumbHeight} loading="lazy" decoding="async" />
              <figcaption><span>{names[photo.event]}</span><span>{photo.slug}</span></figcaption>
            </figure>
          );
        })}
      </div>
    </div>
  );
}
