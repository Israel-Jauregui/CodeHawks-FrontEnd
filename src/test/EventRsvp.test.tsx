import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EventsSection from '../components/browser/modules/EventsSection';

const mocks = vi.hoisted(() => ({ auth: vi.fn(), getEvents: vi.fn(), getRsvp: vi.fn(), setRsvp: vi.fn() }));
vi.mock('../auth/AuthContext', () => ({ useAuth: mocks.auth }));
vi.mock('../services/clubDataProvider', () => ({ isUsingLocalData: false, clubDataProvider: { getEvents: mocks.getEvents, getEventRsvp: mocks.getRsvp, setEventRsvp: mocks.setRsvp } }));
const event = { id: 'event', name: 'Code Night', description: 'Coding', location: 'Campus', startsAt: '2099-01-01T17:00:00Z', endsAt: '2099-01-01T19:00:00Z' };

describe('saved RSVPs', () => {
  beforeEach(() => {
    mocks.auth.mockReturnValue({ isAuthenticated: true, user: { id: 'member-a' } });
    mocks.getEvents.mockResolvedValue([event]); mocks.getRsvp.mockReset(); mocks.setRsvp.mockReset();
  });
  it('restores persisted selection after leaving and returning to the calendar', async () => {
    let saved: 'going' | 'maybe' | null = 'maybe';
    mocks.getRsvp.mockImplementation(async () => saved);
    mocks.setRsvp.mockImplementation(async (_id, status) => { saved = status; });
    const first = render(<EventsSection />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Maybe' })).toHaveAttribute('aria-pressed', 'true'));
    await userEvent.click(screen.getByRole('button', { name: 'Going' }));
    await waitFor(() => expect(saved).toBe('going'));
    first.unmount(); render(<EventsSection />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Going' })).toHaveAttribute('aria-pressed', 'true'));
  });
  it('ignores a late response from the previous account', async () => {
    let resolveOld!: (status: 'going') => void;
    mocks.getRsvp.mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve; })).mockResolvedValue(null);
    const view = render(<EventsSection />);
    await waitFor(() => expect(mocks.getRsvp).toHaveBeenCalledOnce());
    mocks.auth.mockReturnValue({ isAuthenticated: true, user: { id: 'member-b' } });
    view.rerender(<EventsSection />);
    await waitFor(() => expect(mocks.getRsvp).toHaveBeenCalledTimes(2));
    await act(async () => { resolveOld('going'); });
    expect(screen.getByRole('button', { name: 'Going' })).toHaveAttribute('aria-pressed', 'false');
  });
  it('does not fetch private RSVP data for visitors', async () => {
    mocks.auth.mockReturnValue({ isAuthenticated: false, user: null });
    render(<EventsSection />);
    expect(await screen.findByText('Sign in to RSVP.')).toBeInTheDocument();
    expect(mocks.getRsvp).not.toHaveBeenCalled();
  });
});
