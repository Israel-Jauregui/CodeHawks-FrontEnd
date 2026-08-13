import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { canManageEvents } from '../../../auth/permissions';
import { apiRequest, apiRequestPage } from '../../../services/apiClient';
import type { ClubEvent } from '../../../types/clubData';
import './EventManagerModule.css';

interface EventForm {
  name: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
  imageUrl: string;
  published: boolean;
}

const EMPTY_FORM: EventForm = {
  name: '',
  description: '',
  location: '',
  startsAt: '',
  endsAt: '',
  imageUrl: '',
  published: true,
};

function isHttpsOrEmpty(value: string): boolean {
  if (!value.trim()) return true;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function toApiTimestamp(value: string): string {
  return new Date(value).toISOString();
}

async function loadUpcomingManagedEvents(): Promise<ClubEvent[]> {
  const events: ClubEvent[] = [];
  let cursor: string | undefined;

  do {
    const page = await apiRequestPage<ClubEvent>(
      `/v1/manage/events?limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`,
      { auth: true },
    );
    events.push(...page.data);
    cursor = page.meta.nextCursor ?? undefined;
  } while (cursor);

  const now = Date.now();
  return events
    .filter((clubEvent) => !clubEvent.archived && Date.parse(clubEvent.endsAt) >= now)
    .sort((first, second) => Date.parse(first.startsAt) - Date.parse(second.startsAt));
}

export default function EventManagerModule() {
  const { user } = useAuth();
  const isAuthorized = canManageEvents(user?.role);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [form, setForm] = useState<EventForm>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(isAuthorized);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!isAuthorized) return;
    setIsLoading(true);
    setError(null);
    try {
      setEvents(await loadUpcomingManagedEvents());
    } catch (unknownError) {
      setEvents([]);
      setError(unknownError instanceof Error ? unknownError.message : 'Unable to load managed events.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthorized]);

  useEffect(() => { void reload(); }, [reload]);

  if (!user) {
    return <section className="event-manager"><fieldset><legend>Sign In Required</legend><p>Sign in with an officer account to manage events.</p></fieldset></section>;
  }

  if (!isAuthorized) {
    return <section className="event-manager"><fieldset className="event-manager__error"><legend>Access Denied</legend><p>Your club role does not include event-management permission.</p></fieldset></section>;
  }

  const createEvent: React.FormEventHandler<HTMLFormElement> = async (submitEvent) => {
    submitEvent.preventDefault();
    setMessage(null);
    setError(null);

    const startsAt = Date.parse(form.startsAt);
    const endsAt = Date.parse(form.endsAt);
    if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt)) {
      setError('Choose a valid start and end date.');
      return;
    }
    if (endsAt <= startsAt) {
      setError('The event must end after it starts.');
      return;
    }
    if (endsAt < Date.now()) {
      setError('New events must end in the future.');
      return;
    }
    if (!isHttpsOrEmpty(form.imageUrl)) {
      setError('The image URL must be a valid HTTPS URL.');
      return;
    }

    setIsSaving(true);
    try {
      const created = await apiRequest<ClubEvent>('/v1/events', {
        method: 'POST',
        auth: true,
        body: {
          name: form.name.trim(),
          description: form.description.trim(),
          location: form.location.trim(),
          startsAt: toApiTimestamp(form.startsAt),
          endsAt: toApiTimestamp(form.endsAt),
          ...(form.imageUrl.trim() ? { imageUrl: form.imageUrl.trim() } : {}),
          published: form.published,
        },
      });
      setMessage(`Event “${created.name}” was ${created.published ? 'published' : 'saved as a draft'}.`);
      setForm(EMPTY_FORM);
      await reload();
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : 'Unable to create the event.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="event-manager">
      <div className="event-manager__heading">
        <div>
          <h2>Event Manager</h2>
          <p>Create upcoming CodeHawks events and review scheduled drafts or publications.</p>
        </div>
        <button type="button" onClick={() => void reload()} disabled={isLoading}>Refresh</button>
      </div>

      {message && <fieldset className="event-manager__success"><legend>Success</legend><p>{message}</p></fieldset>}
      {error && <fieldset className="event-manager__error"><legend>Error</legend><p>{error}</p></fieldset>}

      <fieldset className="event-manager__form-wrapper">
        <legend>Create Event</legend>
        <form className="event-manager__form" onSubmit={createEvent}>
          <label><span>Event Name *</span><input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} maxLength={140} required /></label>
          <label><span>Location *</span><input value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} maxLength={300} required /></label>
          <label><span>Starts *</span><input type="datetime-local" value={form.startsAt} onChange={(event) => setForm((current) => ({ ...current, startsAt: event.target.value }))} required /></label>
          <label><span>Ends *</span><input type="datetime-local" value={form.endsAt} onChange={(event) => setForm((current) => ({ ...current, endsAt: event.target.value }))} required /></label>
          <label className="event-manager__full"><span>Description *</span><textarea rows={5} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} maxLength={5000} required /></label>
          <label className="event-manager__full"><span>Image URL</span><input type="url" value={form.imageUrl} onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))} placeholder="https://example.com/event.png" /></label>
          <label className="event-manager__publish"><input type="checkbox" checked={form.published} onChange={(event) => setForm((current) => ({ ...current, published: event.target.checked }))} /><span>Publish immediately</span></label>
          <div className="event-manager__actions"><button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : form.published ? 'Create and Publish' : 'Save Draft'}</button></div>
        </form>
      </fieldset>

      <fieldset className="event-manager__schedule">
        <legend>Upcoming Schedule</legend>
        {isLoading && <p>Loading upcoming events...</p>}
        {!isLoading && events.length === 0 && <p>No upcoming drafts or published events.</p>}
        {!isLoading && events.length > 0 && (
          <div className="event-manager__list">
            {events.map((clubEvent) => (
              <article key={clubEvent.id}>
                <div>
                  <strong>{clubEvent.name}</strong>
                  <span>{new Date(clubEvent.startsAt).toLocaleString()} – {new Date(clubEvent.endsAt).toLocaleString()}</span>
                  <span>{clubEvent.location}</span>
                </div>
                <span className={`event-manager__status ${clubEvent.published ? 'is-published' : 'is-draft'}`}>{clubEvent.published ? 'Published' : 'Draft'}</span>
              </article>
            ))}
          </div>
        )}
      </fieldset>
    </section>
  );
}
