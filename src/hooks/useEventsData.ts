import { useCallback, useEffect, useState } from 'react';
import { clubDataProvider } from '../services/clubDataProvider';
import type { ClubEvent, EventRsvpStatus } from '../types/clubData';

export function useEventsData() {
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSavingRsvp, setIsSavingRsvp] = useState(false);
  const [rsvpError, setRsvpError] = useState<string | null>(null);
  const [rsvpByEvent, setRsvpByEvent] = useState<Record<string, EventRsvpStatus>>({});

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

  return { events, isLoading, error, reload, isSavingRsvp, rsvpError, rsvpByEvent, setRsvp };
}
