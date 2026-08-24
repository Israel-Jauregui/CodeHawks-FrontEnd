import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type BrowserRoute = 'home' | 'projects' | 'team' | 'profile' | 'notifications' | 'event-manager';

interface BrowserNavigationState {
  currentRoute: BrowserRoute;
  backStack: BrowserRoute[];
  forwardStack: BrowserRoute[];
}

interface UseBrowserNavigationResult {
  currentRoute: BrowserRoute;
  currentAddress: string;
  canGoBack: boolean;
  canGoForward: boolean;
  navigateToRoute: (route: BrowserRoute) => void;
  goBack: () => void;
  goForward: () => void;
}

const SESSION_STORAGE_KEY = 'clubWebsite.browserNavigation.v1';
const HISTORY_INDEX_KEY = 'codehawksNavigationIndex';
const HISTORY_ROUTE_KEY = 'codehawksNavigationRoute';

const ROUTE_PATH_MAP: Record<BrowserRoute, string> = {
  home: '/',
  projects: '/projects',
  team: '/team',
  profile: '/profile',
  notifications: '/notifications',
  'event-manager': '/manage/events',
};

const ROUTE_ADDRESS_MAP: Record<BrowserRoute, string> = {
  home: 'https://codehawks.org/',
  projects: 'https://codehawks.org/projects',
  team: 'https://codehawks.org/team',
  profile: 'https://codehawks.org/profile',
  notifications: 'https://codehawks.org/notifications',
  'event-manager': 'https://codehawks.org/manage/events',
};

function isValidBrowserRoute(value: unknown): value is BrowserRoute {
  return value === 'home'
    || value === 'projects'
    || value === 'team'
    || value === 'profile'
    || value === 'notifications'
    || value === 'event-manager';
}

function readNavigationStateFromSession(): BrowserNavigationState | null {
  const serialized = window.sessionStorage.getItem(SESSION_STORAGE_KEY);

  if (!serialized) {
    return null;
  }

  try {
    const parsed = JSON.parse(serialized) as BrowserNavigationState;

    if (!isValidBrowserRoute(parsed.currentRoute)) {
      return null;
    }

    if (!Array.isArray(parsed.backStack) || !Array.isArray(parsed.forwardStack)) {
      return null;
    }

    const backStack = parsed.backStack.filter((route): route is BrowserRoute => isValidBrowserRoute(route));
    const forwardStack = parsed.forwardStack.filter((route): route is BrowserRoute => isValidBrowserRoute(route));

    return {
      currentRoute: parsed.currentRoute,
      backStack,
      forwardStack,
    };
  } catch {
    return null;
  }
}

function writeNavigationStateToSession(state: BrowserNavigationState) {
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
}

function createInitialState(initialRoute: BrowserRoute): BrowserNavigationState {
  const restored = readNavigationStateFromSession();
  return restored?.currentRoute === initialRoute
    ? restored
    : { currentRoute: initialRoute, backStack: [], forwardStack: [] };
}

function routeFromPathname(pathname: string): BrowserRoute | null {
  const normalizedPath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
  return (Object.entries(ROUTE_PATH_MAP).find(([, path]) => path === normalizedPath)?.[0] as BrowserRoute | undefined)
    ?? (normalizedPath === '/home' ? 'home' : null);
}

function historyIndexFromState(state: unknown): number {
  if (!state || typeof state !== 'object') return 0;
  const value = (state as Record<string, unknown>)[HISTORY_INDEX_KEY];
  return typeof value === 'number' && Number.isInteger(value) ? value : 0;
}

function historyState(route: BrowserRoute, index: number): Record<string, unknown> {
  const existing = window.history.state;
  return {
    ...(existing && typeof existing === 'object' ? existing as Record<string, unknown> : {}),
    [HISTORY_ROUTE_KEY]: route,
    [HISTORY_INDEX_KEY]: index,
  };
}

export function useBrowserNavigation(initialRoute: BrowserRoute = 'home'): UseBrowserNavigationResult {
  const [navigationState, setNavigationState] = useState<BrowserNavigationState>(() => createInitialState(initialRoute));
  const navigationStateRef = useRef(navigationState);
  const historyIndexRef = useRef(historyIndexFromState(window.history.state));

  const commitState = useCallback((nextState: BrowserNavigationState) => {
    navigationStateRef.current = nextState;
    writeNavigationStateToSession(nextState);
    setNavigationState(nextState);
  }, []);

  useEffect(() => {
    window.history.replaceState(
      historyState(navigationStateRef.current.currentRoute, historyIndexRef.current),
      '',
      window.location.href,
    );

    const handlePopState = (event: PopStateEvent) => {
      const nextRoute = routeFromPathname(window.location.pathname);
      if (!nextRoute) return;

      const currentState = navigationStateRef.current;
      const currentIndex = historyIndexRef.current;
      const nextIndex = historyIndexFromState(event.state);
      let nextState = currentState;

      if (nextIndex < currentIndex) {
        const backStack = [...currentState.backStack];
        const forwardStack = [...currentState.forwardStack];
        let route = currentState.currentRoute;
        for (let step = currentIndex; step > nextIndex; step -= 1) {
          const previousRoute = backStack.pop();
          if (!previousRoute) break;
          forwardStack.unshift(route);
          route = previousRoute;
        }
        nextState = route === nextRoute
          ? { currentRoute: route, backStack, forwardStack }
          : { currentRoute: nextRoute, backStack: [], forwardStack: [] };
      } else if (nextIndex > currentIndex) {
        const backStack = [...currentState.backStack];
        const forwardStack = [...currentState.forwardStack];
        let route = currentState.currentRoute;
        for (let step = currentIndex; step < nextIndex; step += 1) {
          const nextForwardRoute = forwardStack.shift();
          if (!nextForwardRoute) break;
          backStack.push(route);
          route = nextForwardRoute;
        }
        nextState = route === nextRoute
          ? { currentRoute: route, backStack, forwardStack }
          : { currentRoute: nextRoute, backStack: [], forwardStack: [] };
      } else if (nextRoute !== currentState.currentRoute) {
        nextState = { currentRoute: nextRoute, backStack: [], forwardStack: [] };
      }

      historyIndexRef.current = nextIndex;
      commitState(nextState);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [commitState]);

  const navigateToRoute = useCallback((nextRoute: BrowserRoute) => {
    const currentState = navigationStateRef.current;
    if (currentState.currentRoute === nextRoute) return;

    const nextState: BrowserNavigationState = {
      currentRoute: nextRoute,
      backStack: [...currentState.backStack, currentState.currentRoute],
      forwardStack: [],
    };
    const nextIndex = historyIndexRef.current + 1;

    window.history.pushState(historyState(nextRoute, nextIndex), '', ROUTE_PATH_MAP[nextRoute]);
    historyIndexRef.current = nextIndex;
    commitState(nextState);
  }, [commitState]);

  const goBack = useCallback(() => {
    if (navigationStateRef.current.backStack.length > 0) window.history.back();
  }, []);

  const goForward = useCallback(() => {
    if (navigationStateRef.current.forwardStack.length > 0) window.history.forward();
  }, []);

  const currentAddress = useMemo(() => ROUTE_ADDRESS_MAP[navigationState.currentRoute], [navigationState.currentRoute]);

  return {
    currentRoute: navigationState.currentRoute,
    currentAddress,
    canGoBack: navigationState.backStack.length > 0,
    canGoForward: navigationState.forwardStack.length > 0,
    navigateToRoute,
    goBack,
    goForward,
  };
}
