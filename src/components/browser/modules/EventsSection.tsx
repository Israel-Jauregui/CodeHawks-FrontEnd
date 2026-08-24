import { useAuth } from '../../../auth/AuthContext';
import { useEventsData } from '../../../hooks/useEventsData';
import { isUsingLocalData } from '../../../services/clubDataProvider';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  month: 'short',
  day: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  hour: 'numeric',
  minute: '2-digit',
});

export default function EventsSection() {
  const { isAuthenticated } = useAuth();
  const canRsvp = isUsingLocalData || isAuthenticated;
  const { events, isLoading, error, reload, isSavingRsvp, rsvpError, rsvpByEvent, setRsvp } = useEventsData();

  return (
    <section id="events" className="events-section">
      <h2 className="section-heading">
        <span className="xp-calendar-icon" aria-hidden="true">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="6" width="26" height="22" rx="5" fill="#fff" stroke="#316ac5" strokeWidth="2" />
            <rect x="3" y="6" width="26" height="6" rx="2" fill="#316ac5" />
            <rect x="7" y="10" width="18" height="2" rx="1" fill="#7ec8ff" />
            <rect x="8" y="15" width="4" height="4" rx="1.2" fill="#eaf3ff" stroke="#316ac5" strokeWidth="1" />
            <rect x="14" y="15" width="4" height="4" rx="1.2" fill="#eaf3ff" stroke="#316ac5" strokeWidth="1" />
            <rect x="20" y="15" width="4" height="4" rx="1.2" fill="#eaf3ff" stroke="#316ac5" strokeWidth="1" />
          </svg>
        </span>
        <span className="events-splash-animate">Upcoming Events</span>
      </h2>

      {isLoading && <fieldset className="event-card"><legend>Loading</legend><p role="status">Contacting the CodeHawks calendar...</p></fieldset>}
      {!isLoading && error && (
        <fieldset className="event-card event-card--error" role="alert">
          <legend>Calendar Error</legend>
          <p>{error}</p>
          <button type="button" onClick={() => void reload()}>Try Again</button>
        </fieldset>
      )}
      {!isLoading && !error && events.length === 0 && <fieldset className="event-card"><legend>No Events</legend><p>There are no published events yet. Check back soon.</p></fieldset>}
      {rsvpError && <p className="event-rsvp-message event-rsvp-message--error" role="alert">{rsvpError}</p>}

      {!isLoading && !error && events.length > 0 && (
        <div className="events-list">
          {events.map((clubEvent) => {
            const startsAt = new Date(clubEvent.startsAt);
            const endsAt = new Date(clubEvent.endsAt);
            const rsvp = rsvpByEvent[clubEvent.id];
            return (
              <fieldset key={clubEvent.id} className="event-card">
                <legend>{dateFormatter.format(startsAt).toUpperCase()}</legend>
                <div className="event-details">
                  <h3>{clubEvent.name}</h3>
                  <p>{clubEvent.description}</p>
                  <span className="event-time">{timeFormatter.format(startsAt)} – {timeFormatter.format(endsAt)} · {clubEvent.location}</span>
                  {canRsvp ? (
                    <div className="event-rsvp-actions" role="group" aria-label={`RSVP for ${clubEvent.name}`}>
                      <button type="button" aria-pressed={rsvp === 'going'} className={rsvp === 'going' ? 'is-selected' : ''} onClick={() => void setRsvp(clubEvent.id, 'going')} disabled={isSavingRsvp}>Going</button>
                      <button type="button" aria-pressed={rsvp === 'maybe'} className={rsvp === 'maybe' ? 'is-selected' : ''} onClick={() => void setRsvp(clubEvent.id, 'maybe')} disabled={isSavingRsvp}>Maybe</button>
                      {rsvp && <span role="status" aria-live="polite">Saved: {rsvp}</span>}
                    </div>
                  ) : <p className="event-rsvp-message">Sign in to RSVP.</p>}
                </div>
              </fieldset>
            );
          })}
        </div>
      )}
    </section>
  );
}
