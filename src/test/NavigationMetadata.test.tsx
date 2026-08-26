import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useBrowserNavigation } from '../components/browser/hooks/useBrowserNavigation';
import { usePageMetadata } from '../hooks/usePageMetadata';

describe('route history and metadata', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  it('keeps the virtual browser route synchronized with history and session state', () => {
    const { result } = renderHook(() => useBrowserNavigation('home'));

    act(() => result.current.navigateToRoute('projects'));

    expect(result.current.currentRoute).toBe('projects');
    expect(result.current.currentAddress).toBe('https://codehawks.org/projects');
    expect(result.current.canGoBack).toBe(true);
    expect(window.location.pathname).toBe('/projects');
    expect(JSON.parse(window.sessionStorage.getItem('clubWebsite.browserNavigation.v1') ?? '{}')).toMatchObject({
      currentRoute: 'projects',
      backStack: ['home'],
      forwardStack: [],
    });

    act(() => {
      const state = {
        ...window.history.state,
        codehawksNavigationRoute: 'home',
        codehawksNavigationIndex: 0,
      };
      window.history.replaceState(state, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate', { state }));
    });

    expect(result.current.currentRoute).toBe('home');
    expect(result.current.canGoForward).toBe(true);
  });

  it('treats the public Members directory as an in-browser route', () => {
    const { result } = renderHook(() => useBrowserNavigation('home'));

    act(() => result.current.navigateToRoute('members'));

    expect(result.current.currentRoute).toBe('members');
    expect(result.current.currentAddress).toBe('https://codehawks.org/members');
    expect(window.location.pathname).toBe('/members');
    expect(result.current.canGoBack).toBe(true);
  });

  it('updates canonical, social, and indexing metadata when page state changes', async () => {
    const { rerender } = renderHook(
      ({ path, noIndex }) => usePageMetadata({
        title: path === '/projects' ? 'Projects' : 'Profile',
        description: path === '/projects' ? 'Public projects.' : 'Private profile controls.',
        path,
        noIndex,
      }),
      { initialProps: { path: '/projects', noIndex: false } },
    );

    await waitFor(() => {
      expect(document.title).toBe('Projects | CodeHawks');
      expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
        'href',
        'https://codehawks.org/projects',
      );
      expect(document.querySelector('meta[property="og:url"]')).toHaveAttribute(
        'content',
        'https://codehawks.org/projects',
      );
      expect(document.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
    });

    rerender({ path: '/profile', noIndex: true });

    await waitFor(() => {
      expect(document.title).toBe('Profile | CodeHawks');
      expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
        'href',
        'https://codehawks.org/profile',
      );
      expect(document.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
    });
  });
});
