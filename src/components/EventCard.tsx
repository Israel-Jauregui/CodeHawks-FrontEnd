import type { ClubEvent } from '../constants/events';
import type { Photo } from '../constants/photos.generated';
import RetroWindow from './RetroWindow';

// One event as a retro window. The cover is the photo named in events.ts, or the first one
// in the event's folder; an event with no photos yet gets a placeholder screen instead.
export default function EventCard({ event, photos }: { event: ClubEvent; photos: Photo[] }) {
  const cover = photos.find(photo => photo.slug === event.cover) ?? photos[0];
  const facts = [event.where, event.when].filter(Boolean).join(' // ');
  return (
    <article className="event" id={`event-${event.slug}`} data-hosted={event.hosted || undefined}>
      <RetroWindow
        title={<><span className="win__dir">C:\CODEHAWKS\EVENTS\</span>{event.slug.toUpperCase()}.LOG</>}
        status={[event.kind, photos.length ? `${photos.length} photo${photos.length === 1 ? '' : 's'}` : 'Photos soon']}
      >
        {cover
          ? <img className="event__photo" src={`/photos/${cover.event}/thumb/${cover.slug}.webp`} alt={cover.alt} width={cover.thumbWidth} height={cover.thumbHeight} loading="lazy" decoding="async" />
          : <div className="event__photo event__photo--empty" aria-hidden="true"><span>{event.name}</span></div>}
        <div className="event__body">
          {(event.hosted || event.result) && (
            <p className="event__tags">
              {event.hosted && <span>We hosted</span>}
              {event.result && <span className="event__result">{event.result}</span>}
            </p>
          )}
          <h3 className="event__name">{event.name}</h3>
          {facts && <p className="event__facts">{facts}</p>}
          <p className="event__summary">{event.summary}</p>
          {event.link && <p className="event__link"><a href={event.link.href}>{event.link.label} <span aria-hidden="true">↗</span></a></p>}
        </div>
      </RetroWindow>
    </article>
  );
}
