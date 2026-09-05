import { useCallback, useEffect, useState } from 'react';
import { clubDataProvider } from '../services/clubDataProvider';
import type { ClubEvent, EventRsvpStatus } from '../types/clubData';

export function useEventsData(canRsvp = false) {
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSavingRsvp, setIsSavingRsvp] = useState(false);
  const [rsvpError, setRsvpError] = useState<string | null>(null);
  const [rsvpByEvent, setRsvpByEvent] = useState<Record<string, EventRsvpStatus>>({});
  const [isLoadingRsvps, setIsLoadingRsvps] = useState(false);

  useEffect(() => {
    if (!canRsvp) return;
    // Ignore responses after this view unmounts or its event list changes.
    // EventsSection keys the view by account so saved choices never cross sessions.
    let current = true;
    setIsLoadingRsvps(true);
    setRsvpError(null);
    void Promise.all(events.map(async (event) => [event.id, await clubDataProvider.getEventRsvp(event.id)] as const))
      .then((entries) => {
        if (!current) return;
        setRsvpByEvent(Object.fromEntries(entries.filter((entry): entry is readonly [string, EventRsvpStatus] => entry[1] !== null)));
      })
      .catch(() => { if (current) setRsvpError('Unable to load your saved RSVPs. Try refreshing the calendar.'); })
      .finally(() => { if (current) setIsLoadingRsvps(false); });
    return () => { current = false; };
  }, [canRsvp, events]);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const now = Date.now();
      const upcomingEvents = (await clubDataProvider.getEvents())
        .filter((clubEvent) => Date.parse(clubEvent.endsAt) >= now)
        .sort((first, second) => Date.parse(first.startsAt) - Date.parse(second.startsAt));
      setEvents(upcomingEvents);
    } catch (unknownError) {
      setEvents([]);
      setError(unknownError instanceof Error ? unknownError.message : 'Unable to load upcoming events.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setRsvp = useCallback(async (eventId: string, status: EventRsvpStatus) => {
    setIsSavingRsvp(true);
    setRsvpError(null);
    try {
      await clubDataProvider.setEventRsvp(eventId, status);
      setRsvpByEvent((current) => ({ ...current, [eventId]: status }));
    } catch (unknownError) {
      setRsvpError(unknownError instanceof Error ? unknownError.message : 'Unable to save your RSVP.');
    } finally {
      setIsSavingRsvp(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  return { events, isLoading, error, reload, isSavingRsvp: isSavingRsvp || isLoadingRsvps, rsvpError, rsvpByEvent, setRsvp };
}
