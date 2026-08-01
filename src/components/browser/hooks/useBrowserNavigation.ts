import { useMemo, useState } from 'react';

export type BrowserRoute = 'home' | 'projects' | 'team';

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

const ROUTE_ADDRESS_MAP: Record<BrowserRoute, string> = {
  home: 'http://www.codehawks.org/home',
  projects: 'http://www.codehawks.org/projects',
  team: 'http://www.codehawks.org/team',
};

function isValidBrowserRoute(value: unknown): value is BrowserRoute {
  return value === 'home' || value === 'projects' || value === 'team';
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

function createInitialState(): BrowserNavigationState {
  return (
    readNavigationStateFromSession() ?? {
      currentRoute: 'home',
      backStack: [],
      forwardStack: [],
    }
  );
}

export function useBrowserNavigation(): UseBrowserNavigationResult {
  const [navigationState, setNavigationState] = useState<BrowserNavigationState>(createInitialState);

  const navigateToRoute = (nextRoute: BrowserRoute) => {
    setNavigationState((currentState) => {
      if (currentState.currentRoute === nextRoute) {
        return currentState;
      }

      const nextState: BrowserNavigationState = {
        currentRoute: nextRoute,
        backStack: [...currentState.backStack, currentState.currentRoute],
        forwardStack: [],
      };

      writeNavigationStateToSession(nextState);
      return nextState;
    });
  };

  const goBack = () => {
    setNavigationState((currentState) => {
      if (currentState.backStack.length === 0) {
        return currentState;
      }

      const previousRoute = currentState.backStack[currentState.backStack.length - 1];
      const nextState: BrowserNavigationState = {
        currentRoute: previousRoute,
        backStack: currentState.backStack.slice(0, -1),
        forwardStack: [currentState.currentRoute, ...currentState.forwardStack],
      };

      writeNavigationStateToSession(nextState);
      return nextState;
    });
  };

  const goForward = () => {
    setNavigationState((currentState) => {
      if (currentState.forwardStack.length === 0) {
        return currentState;
      }

      const [nextRoute, ...remainingForwardStack] = currentState.forwardStack;
      const nextState: BrowserNavigationState = {
        currentRoute: nextRoute,
        backStack: [...currentState.backStack, currentState.currentRoute],
        forwardStack: remainingForwardStack,
      };

      writeNavigationStateToSession(nextState);
      return nextState;
    });
  };

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
