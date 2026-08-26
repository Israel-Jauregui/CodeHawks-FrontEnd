import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import TopAppBar from '../components/TopAppBar';
import LoginModal from '../components/LoginModal';
import NighthawkMascot from '../components/NighthawkMascot';
import HacklonegaAd, { HacklonegaNgMark } from '../components/HacklonegaAd';
import BrowserContentHost from '../components/browser/BrowserContentHost';
import LegalFooter from '../components/LegalFooter';
import { useBrowserNavigation, type BrowserRoute } from '../components/browser/hooks/useBrowserNavigation';
import { usePageMetadata } from '../hooks/usePageMetadata';
import { SITE_DESCRIPTION, SITE_IDENTITY } from '../constants/site';
import './Homepage.css';

type DesktopWindowId = 'browser' | 'cwInfo' | 'hacklonega';

type WindowPosition = {
  x: number;
  y: number;
};

type DesktopWindowPositions = Record<DesktopWindowId, WindowPosition>;

type DesktopWindowOpenState = Record<DesktopWindowId, boolean>;
type DesktopWindowMinimizedState = Record<DesktopWindowId, boolean>;
type DesktopWindowMaximizedState = Record<DesktopWindowId, boolean>;

type DesktopWindowDraggedState = Record<DesktopWindowId, boolean>;

const EASTERN_TIME_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

/**
 * Homepage — The main CodeHawks website surface.
 *
 * HOW THIS COMPONENT IS STRUCTURED (React concepts explained):
 * ─────────────────────────────────────────────────────────────
 * This is a **functional component** — a plain JavaScript function that
 * returns JSX (the HTML-like syntax React uses). React calls this function
 * every time it needs to render the page.
 *
 * STATE MANAGEMENT — `useState` for window visibility:
 * ────────────────────────────────────────────────────
 * We use React's `useState` hook to track whether the IE browser window
 * is open or closed. This is the simplest form of state in React:
 *
 *   const [value, setValue] = useState(initialValue);
 *
 * - `value` is the *current* state (read-only snapshot)
 * - `setValue` is a function to *update* state (triggers a re-render)
 * - `initialValue` is what `value` starts as on first render
 *
 * When `setIsBrowserOpen(false)` is called (via the Close button), React:
 *   1. Schedules a re-render of this component
 *   2. Calls `Homepage()` again
 *   3. `isBrowserOpen` is now `false`
 *   4. The `{isBrowserOpen && (...)}` expression evaluates to `false`
 *   5. React removes the entire browser window from the DOM
 *
 * The desktop icons remain visible because they're rendered unconditionally
 * outside the conditional block.
 *
 * LAYOUT (XP Desktop metaphor):
 *   ┌─── .xp-desktop (fills viewport) ─────────────────────────┐
 *   │                                                           │
 *   │  ┌── .desktop-icons ──┐                                   │
 *   │  │ [App Development Club Website] │   ┌── .window (conditional) ──┐  │
 *   │  │ [Projects]         │   │ TopAppBar (title bar +     │  │
 *   │  │ [Hacklonega]       │   │   toolbars)                │  │
 *   │  │                    │   │ Window body (sections)     │  │
 *   │  └────────────────────┘   │ Status bar (footer)        │  │
 *   │                           └────────────────────────────┘  │
 *   └──────────────────────────────────────────────────────────┘
 */
interface HomepageProps {
  initialRoute?: BrowserRoute;
}

const PAGE_METADATA: Record<BrowserRoute, { title: string; description: string; path: string; noIndex?: boolean }> = {
  home: {
    title: SITE_IDENTITY.publicName,
    description: SITE_DESCRIPTION,
    path: '/',
  },
  projects: { title: 'Projects', description: 'Browse public CodeHawks software projects.', path: '/projects' },
  team: { title: 'Teams', description: 'Browse public CodeHawks project, study, and competition teams.', path: '/team' },
  members: { title: 'Members', description: 'Browse CodeHawks members who opted into the public member directory.', path: '/members' },
  profile: { title: 'Profile', description: 'Manage your private CodeHawks member profile and privacy choices.', path: '/profile', noIndex: true },
  notifications: { title: 'Notifications', description: 'Review your CodeHawks member notifications.', path: '/notifications', noIndex: true },
  'event-manager': { title: 'Event Manager', description: 'Manage CodeHawks club events.', path: '/manage/events', noIndex: true },
};

export const Homepage: React.FC<HomepageProps> = ({ initialRoute = 'home' }) => {
  const DESKTOP_WINDOW_ORDER: DesktopWindowId[] = ['browser', 'cwInfo', 'hacklonega'];
  const WINDOW_DISPLAY_NAMES: Record<DesktopWindowId, string> = {
    browser: `${SITE_IDENTITY.currentClubName} Website`,
    cwInfo: 'Coding Warriors',
    hacklonega: 'Hacklonega',
  };

  const desktopRef = useRef<HTMLDivElement | null>(null);
  const desktopWindowRefs = useRef<Record<DesktopWindowId, HTMLDivElement | null>>({
    browser: null,
    cwInfo: null,
    hacklonega: null,
  });
  const dragStateRef = useRef<{
    windowId: DesktopWindowId;
    pointerId: number;
    pointerOffsetX: number;
    pointerOffsetY: number;
  } | null>(null);
  const startMenuRef = useRef<HTMLDivElement | null>(null);

  // ── Login Modal State ───────────────────────────────────────
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const [trayTime, setTrayTime] = useState(() => EASTERN_TIME_FORMATTER.format(new Date()));
  const startMenuLinks = [
    {
      id: 'adc-connect',
      label: SITE_IDENTITY.currentClubName,
      href: 'https://connect.ung.edu/organization/app-development-club-of-ung--dah-',
      iconType: 'club',
    },
    {
      id: 'cw-connect',
      label: 'Coding Warriors',
      href: 'https://connect.ung.edu/organization/the-coding-warriors--gvl-',
      iconType: 'terminal',
    },
  ] as const;

  useEffect(() => {
    const syncTrayTime = () => {
      setTrayTime(EASTERN_TIME_FORMATTER.format(new Date()));
    };

    syncTrayTime();

    const timerId = window.setInterval(syncTrayTime, 30000);
    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  useEffect(() => {
    if (!isStartMenuOpen) {
      return undefined;
    }

    const handleDocumentPointerDown = (event: PointerEvent) => {
      const startMenuElement = startMenuRef.current;
      const target = event.target as Node;

      if (startMenuElement && !startMenuElement.contains(target)) {
        setIsStartMenuOpen(false);
      }
    };

    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsStartMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleDocumentPointerDown);
    document.addEventListener('keydown', handleDocumentKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handleDocumentPointerDown);
      document.removeEventListener('keydown', handleDocumentKeyDown);
    };
  }, [isStartMenuOpen]);

  // ── Window State ──────────────────────────────────────────────
  // Tracks whether the IE browser window is visible on the desktop.
  //
  // REACT CONCEPT — useState Hook:
  // `useState` is one of the most fundamental React hooks. It lets a
  // functional component "remember" a value across re-renders.
  //
  // The `<boolean>` generic tells TypeScript this state is specifically
  // a boolean — not string, not number. This catches bugs at compile
  // time (e.g., accidentally doing `setIsBrowserOpen("yes")` would
  // be a type error).
  //
  // The destructured tuple `[isBrowserOpen, setIsBrowserOpen]`:
  //   - `isBrowserOpen`    → current value (starts as `true`)
  //   - `setIsBrowserOpen` → function to change the value
  //
  // When `setIsBrowserOpen` is called, React re-renders this component.
  // The old DOM nodes for the browser window are removed, and React
  // builds new DOM based on the updated state. This is what makes
  // React "reactive" — UI is always a function of current state.
  const [openWindows, setOpenWindows] = useState<DesktopWindowOpenState>({
    browser: true,
    cwInfo: false,
    hacklonega: false,
  });
  const [minimizedWindows, setMinimizedWindows] = useState<DesktopWindowMinimizedState>({
    browser: false,
    cwInfo: false,
    hacklonega: false,
  });
  const [maximizedWindows, setMaximizedWindows] = useState<DesktopWindowMaximizedState>({
    browser: false,
    cwInfo: false,
    hacklonega: false,
  });
  const [activeWindowId, setActiveWindowId] = useState<DesktopWindowId>('browser');
  const [windowOrder, setWindowOrder] = useState<DesktopWindowId[]>(DESKTOP_WINDOW_ORDER);
  const [draggedWindows, setDraggedWindows] = useState<DesktopWindowDraggedState>({
    browser: false,
    cwInfo: false,
    hacklonega: false,
  });
  const [windowPositions, setWindowPositions] = useState<DesktopWindowPositions>({
    browser: { x: 152, y: 20 },
    cwInfo: { x: 230, y: 68 },
    hacklonega: { x: 184, y: 36 },
  });
  const [restoreWindowPositions, setRestoreWindowPositions] = useState<DesktopWindowPositions>({
    browser: { x: 152, y: 20 },
    cwInfo: { x: 230, y: 68 },
    hacklonega: { x: 184, y: 36 },
  });
  const [sectionScrollTarget, setSectionScrollTarget] = useState<string | null>(null);
  const {
    currentRoute,
    currentAddress,
    canGoBack,
    canGoForward,
    navigateToRoute,
    goBack,
    goForward,
  } = useBrowserNavigation(initialRoute);

  usePageMetadata(PAGE_METADATA[currentRoute]);

  // These constants define the "default launch slot" of the browser
  // window on the XP desktop. We keep the browser offset from the icon
  // column, then clamp it back into the visible desktop when the user
  // resizes the viewport or drags the window around.
  const MOBILE_BREAKPOINT = 768;
  const WINDOW_MIN_POSITIONS: DesktopWindowPositions = {
    browser: { x: 152, y: 20 },
    cwInfo: { x: 230, y: 68 },
    hacklonega: { x: 184, y: 36 },
  };
  const DESKTOP_WINDOW_EDGE_PADDING = 16;

  const clampWindowPosition = (
    windowId: DesktopWindowId,
    nextPosition: WindowPosition,
  ) => {
    const desktopElement = desktopRef.current;
    const desktopWindowElement = desktopWindowRefs.current[windowId];

    if (
      !desktopElement ||
      !desktopWindowElement ||
      window.innerWidth <= MOBILE_BREAKPOINT
    ) {
      return WINDOW_MIN_POSITIONS[windowId];
    }

    const maxX = Math.max(
      WINDOW_MIN_POSITIONS[windowId].x,
      desktopElement.clientWidth -
        desktopWindowElement.offsetWidth -
        DESKTOP_WINDOW_EDGE_PADDING,
    );
    const maxY = Math.max(
      WINDOW_MIN_POSITIONS[windowId].y,
      desktopElement.clientHeight -
        desktopWindowElement.offsetHeight -
        DESKTOP_WINDOW_EDGE_PADDING,
    );

    return {
      x: Math.min(Math.max(nextPosition.x, WINDOW_MIN_POSITIONS[windowId].x), maxX),
      y: Math.min(Math.max(nextPosition.y, WINDOW_MIN_POSITIONS[windowId].y), maxY),
    };
  };

  // Re-clamp the browser window whenever it mounts or the viewport size
  // changes. This mirrors a real desktop manager: windows keep their
  // coordinates, but the system nudges them back into view if the screen
  // becomes too small to fit the old position.
  useLayoutEffect(() => {
    if (!openWindows.browser && !openWindows.cwInfo && !openWindows.hacklonega) {
      return undefined;
    }

    const syncWindowIntoViewport = () => {
      if (window.innerWidth <= MOBILE_BREAKPOINT) {
        return;
      }

      setWindowPositions((currentPositions) => {
        const nextPositions = { ...currentPositions };

        (Object.keys(currentPositions) as DesktopWindowId[]).forEach((windowId) => {
          let preferredPosition = currentPositions[windowId];
          const desktopElement = desktopRef.current;
          const desktopWindowElement = desktopWindowRefs.current[windowId];

          if (!draggedWindows[windowId] && desktopElement && desktopWindowElement) {
            const centerX = Math.max(
              WINDOW_MIN_POSITIONS[windowId].x,
              (desktopElement.clientWidth - desktopWindowElement.offsetWidth) / 2,
            );
            const centerY = Math.max(
              WINDOW_MIN_POSITIONS[windowId].y,
              (desktopElement.clientHeight - desktopWindowElement.offsetHeight) / 2,
            );
            preferredPosition = { x: centerX, y: centerY };
          } else if (!draggedWindows[windowId]) {
            preferredPosition = WINDOW_MIN_POSITIONS[windowId];
          }

          nextPositions[windowId] = clampWindowPosition(windowId, preferredPosition);
        });

        return nextPositions;
      });
    };

    syncWindowIntoViewport();
    window.addEventListener('resize', syncWindowIntoViewport);

    return () => {
      window.removeEventListener('resize', syncWindowIntoViewport);
    };
  }, [draggedWindows, openWindows]);

  const setWindowOpen = (windowId: DesktopWindowId, isOpen: boolean) => {
    setOpenWindows((currentWindows) => ({
      ...currentWindows,
      [windowId]: isOpen,
    }));

    if (!isOpen) {
      setMinimizedWindows((currentMinimizedWindows) => ({
        ...currentMinimizedWindows,
        [windowId]: false,
      }));
      setMaximizedWindows((currentMaximizedWindows) => ({
        ...currentMaximizedWindows,
        [windowId]: false,
      }));
    }
  };

  const activateWindow = (windowId: DesktopWindowId) => {
    setActiveWindowId(windowId);
    setWindowOrder((currentOrder) => {
      const remainingWindows = currentOrder.filter((id) => id !== windowId);
      return [...remainingWindows, windowId];
    });
  };

  const setWindowMinimized = (windowId: DesktopWindowId, isMinimized: boolean) => {
    setMinimizedWindows((currentMinimizedWindows) => ({
      ...currentMinimizedWindows,
      [windowId]: isMinimized,
    }));

    if (!isMinimized) {
      activateWindow(windowId);
    }
  };

  const toggleWindowMaximized = (windowId: DesktopWindowId) => {
    if (window.innerWidth <= MOBILE_BREAKPOINT || !openWindows[windowId]) {
      return;
    }

    if (maximizedWindows[windowId]) {
      const restorePosition = restoreWindowPositions[windowId];
      setMaximizedWindows((currentMaximizedWindows) => ({
        ...currentMaximizedWindows,
        [windowId]: false,
      }));
      setWindowPositions((currentPositions) => ({
        ...currentPositions,
        [windowId]: clampWindowPosition(windowId, restorePosition),
      }));
      setDraggedWindows((currentDraggedWindows) => ({
        ...currentDraggedWindows,
        [windowId]: true,
      }));
      activateWindow(windowId);
      return;
    }

    setRestoreWindowPositions((currentRestorePositions) => ({
      ...currentRestorePositions,
      [windowId]: windowPositions[windowId],
    }));
    setWindowMinimized(windowId, false);
    setMaximizedWindows((currentMaximizedWindows) => ({
      ...currentMaximizedWindows,
      [windowId]: true,
    }));
    activateWindow(windowId);
  };

  const handleTaskbarWindowToggle = (windowId: DesktopWindowId) => {
    if (!openWindows[windowId]) {
      return;
    }

    if (minimizedWindows[windowId]) {
      setWindowMinimized(windowId, false);
      return;
    }

    if (activeWindowId === windowId) {
      setWindowMinimized(windowId, true);
      return;
    }

    activateWindow(windowId);
  };

  const launchDesktopWindow = (windowId: DesktopWindowId) => {
    setDraggedWindows((currentDraggedWindows) => ({
      ...currentDraggedWindows,
      [windowId]: false,
    }));
    setWindowPositions((currentPositions) => ({
      ...currentPositions,
      [windowId]: WINDOW_MIN_POSITIONS[windowId],
    }));
    setWindowOpen(windowId, true);
    setWindowMinimized(windowId, false);
    setMaximizedWindows((currentMaximizedWindows) => ({
      ...currentMaximizedWindows,
      [windowId]: false,
    }));
    activateWindow(windowId);
  };

  const launchBrowserWithRoute = (route: BrowserRoute) => {
    launchDesktopWindow('browser');
    navigateToRoute(route);
  };

  const handleBrowserRouteNavigation = (route: BrowserRoute) => {
    navigateToRoute(route);
  };

  const handleBrowserSectionNavigation = (sectionId: 'about' | 'events' | 'contact') => {
    if (currentRoute !== 'home') {
      navigateToRoute('home');
    }

    setSectionScrollTarget(sectionId);
  };

  const stopWindowDrag = () => {
    dragStateRef.current = null;
    document.body.classList.remove('xp-window-dragging');
  };

  const handleWindowTitleBarPointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
    windowId: DesktopWindowId,
  ) => {
    if (window.innerWidth <= MOBILE_BREAKPOINT) {
      return;
    }

    if (maximizedWindows[windowId]) {
      return;
    }

    const target = event.target as HTMLElement;
    if (target.closest('button, a, input, textarea, select, label')) {
      return;
    }

    const desktopWindowElement = desktopWindowRefs.current[windowId];
    if (!desktopWindowElement) {
      return;
    }

    const windowRect = desktopWindowElement.getBoundingClientRect();

    dragStateRef.current = {
      windowId,
      pointerId: event.pointerId,
      pointerOffsetX: event.clientX - windowRect.left,
      pointerOffsetY: event.clientY - windowRect.top,
    };

    setDraggedWindows((currentDraggedWindows) => ({
      ...currentDraggedWindows,
      [windowId]: true,
    }));
    event.currentTarget.setPointerCapture(event.pointerId);
    document.body.classList.add('xp-window-dragging');
  };

  const handleWindowTitleBarPointerMove = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    const dragState = dragStateRef.current;
    const desktopElement = desktopRef.current;

    if (
      !dragState ||
      dragState.pointerId !== event.pointerId ||
      !desktopElement ||
      window.innerWidth <= MOBILE_BREAKPOINT
    ) {
      return;
    }

    const desktopRect = desktopElement.getBoundingClientRect();
    const unclampedPosition = {
      x: event.clientX - desktopRect.left - dragState.pointerOffsetX,
      y: event.clientY - desktopRect.top - dragState.pointerOffsetY,
    };

    setWindowPositions((currentPositions) => ({
      ...currentPositions,
      [dragState.windowId]: clampWindowPosition(dragState.windowId, unclampedPosition),
    }));
  };

  const handleWindowTitleBarPointerUp = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    event.currentTarget.releasePointerCapture(event.pointerId);
    stopWindowDrag();
  };

  const cwArt = [
    " ██████╗██╗    ██╗",
    "██╔════╝██║    ██║",
    "██║     ██║ █╗ ██║",
    "██║     ██║███╗██║",
    "╚██████╗╚███╔███╔╝",
    " ╚═════╝ ╚══╝╚══╝ ",
  ];
  const cwInfoRows: { label: string; value: React.ReactNode }[] = [
    { label: 'OS', value: 'CodingWarriors @ UNG' },
    { label: 'Host', value: 'Online Discord / Teams' },
    { label: 'Kernel', value: 'ICPC Preparation' },
    { label: 'Uptime', value: 'Biweekly online meetings' },
    { label: 'Shell', value: 'bash, zsh, and last-minute stdin hacks' },
    { label: 'Languages', value: 'Java Python' },
    { label: 'Practice', value: 'LeetCode Codeforces Kattis UVA' },
    { label: 'Connect', value: <a href="https://connect.ung.edu/organization/the-coding-warriors--gvl-" target="_blank" rel="noopener noreferrer" style={{ color: '#7dd6ff', textDecoration: 'underline' }}>UNG Connect</a> },
  ];

  // ── Desktop Icons ───────────────────────────────────────────────
  // Data-driven array of desktop shortcut icons. Each entry defines
  // a label, an icon type (used for CSS styling), and an action.
  //
  // REACT CONCEPT — Data-Driven Rendering:
  // Instead of hard-coding each icon's JSX, we define the *data* in
  // an array and use `.map()` to generate the markup. This means
  // adding a new icon is just one line in the array — no copy-paste
  // of HTML, no risk of typos in repeated markup.
  const desktopIcons = [
    {
      id: 'adc-website',
      label: `${SITE_IDENTITY.currentClubName} Website`,
      iconType: 'globe' as const,
      onActivate: () => launchBrowserWithRoute('home'),
    },
    {
      id: 'cw-info',
      label: 'Coding Warriors',
      iconType: 'terminal' as const,
      onActivate: () => launchDesktopWindow('cwInfo'),
    },
    {
      id: 'projects',
      label: 'Projects',
      iconType: 'folder' as const,
      onActivate: () => launchBrowserWithRoute('projects'),
    },
    {
      id: 'hacklonega',
      label: 'Hacklonega',
      iconType: 'hacklonega' as const,
      onActivate: () => launchDesktopWindow('hacklonega'),
    },
  ];

  return (
    // ── XP Desktop Surface ──────────────────────────────────────
    // The outermost container fills the viewport and acts as the
    // Windows XP desktop. The Bliss wallpaper is on <body> (set in
    // index.css), so this div is transparent — the wallpaper shows
    // through. Desktop icons and the browser window sit on top.
    <div className="xp-desktop" ref={desktopRef}>
      {/* ── Desktop Icons ──────────────────────────────────────────
       * Arranged in a CSS Grid that flows top-to-bottom, then
       * left-to-right — mimicking XP's default icon arrangement.
       *
       * REACT CONCEPT — .map() for Lists:
       * We iterate over `desktopIcons` and produce one <button> per
       * entry. The `key` prop (set to `icon.id`) tells React which
       * DOM node corresponds to which data item. React uses keys to
       * efficiently determine which items changed, were added, or
       * removed during re-renders. Without keys, React would have
       * to re-create every list item on every render.
       *
       * WHY <button> INSTEAD OF <div>?
       * Desktop icons are interactive (double-clickable), so they
       * should be <button> elements for accessibility. Screen readers
       * announce them as interactive controls, and keyboard users can
       * Tab to them and press Enter to activate.
       */}
      <div className="desktop-icons">
        {desktopIcons.map((icon) => (
          <button
            key={icon.id}
            type="button"
            className="desktop-icon"
            onDoubleClick={icon.onActivate}
            onPointerUp={(event) => {
              if (event.pointerType === 'touch') icon.onActivate();
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                icon.onActivate();
              }
            }}
            title={icon.label}
            aria-label={`Open ${icon.label}`}
          >
            <div className={`desktop-icon__img desktop-icon__img--${icon.iconType}`}>
              {icon.iconType === 'hacklonega' && <HacklonegaNgMark />}
            </div>
            <span className="desktop-icon__label">{icon.label}</span>
          </button>
        ))}
      </div>

      {/* ── Browser Window (Conditional) ─────────────────────────
       * REACT CONCEPT — Conditional Rendering:
       * `{isBrowserOpen && (...)}` is a common React pattern. In
       * JavaScript, `true && expression` evaluates to `expression`,
       * while `false && expression` evaluates to `false`. React
       * ignores `false` in JSX output (renders nothing).
       *
       * So when `isBrowserOpen` is true → the browser window renders.
       * When false → React removes it entirely from the DOM.
       *
       * WHY NOT `display: none`?
       * We *could* toggle CSS visibility instead of unmounting. But
       * removing the DOM nodes frees memory and stops any
       * animations or timers inside the unmounted subtree. For a
       * complex component like the browser window, this is cleaner.
       */}
      {openWindows.browser && !minimizedWindows.browser && (
        <div
          className={`window homepage-window${maximizedWindows.browser ? ' is-maximized' : ''}`}
          ref={(element) => {
            desktopWindowRefs.current.browser = element;
          }}
          style={{
            left: `${windowPositions.browser.x}px`,
            top: `${windowPositions.browser.y}px`,
            zIndex: 20 + windowOrder.indexOf('browser'),
          }}
          onPointerDown={() => activateWindow('browser')}
        >
          <TopAppBar
            onClose={() => {
              stopWindowDrag();
              setWindowOpen('browser', false);
            }}
            onMinimize={() => {
              stopWindowDrag();
              setWindowMinimized('browser', true);
            }}
            onMaximize={() => {
              stopWindowDrag();
              toggleWindowMaximized('browser');
            }}
            onTitleBarPointerDown={(event) => handleWindowTitleBarPointerDown(event, 'browser')}
            onTitleBarPointerMove={handleWindowTitleBarPointerMove}
            onTitleBarPointerUp={handleWindowTitleBarPointerUp}
            onTitleBarPointerCancel={stopWindowDrag}
            onLoginClick={() => setIsLoginOpen(true)}
            onNavigateRoute={handleBrowserRouteNavigation}
            onNavigateSection={handleBrowserSectionNavigation}
            onBack={goBack}
            onForward={goForward}
            canGoBack={canGoBack}
            canGoForward={canGoForward}
            currentAddress={currentAddress}
          />
          {/* XP-style Login Modal (focuses screen, XP window style) */}
          <LoginModal
            open={isLoginOpen}
            onClose={() => setIsLoginOpen(false)}
          />

          <div className="window-body homepage-body">
            <BrowserContentHost
              route={currentRoute}
              sectionScrollTarget={sectionScrollTarget}
              onSectionScrollHandled={() => setSectionScrollTarget(null)}
              onNavigateRoute={handleBrowserRouteNavigation}
            />
          </div>

          {/* ── Status Bar (Footer) ──────────────────────────────── */}
          <div className="status-bar ie6-status-bar">
            <p className="status-bar-field status-bar__done">Done</p>
            <p className="status-bar-field status-bar__info">{currentAddress}</p>
            <p className="status-bar-field status-bar__zone">Internet</p>
          </div>
        </div>
      )}

      {openWindows.cwInfo && !minimizedWindows.cwInfo && (
        <div
          className={`window homepage-window cw-window${maximizedWindows.cwInfo ? ' is-maximized' : ''}`}
          ref={(element) => {
            desktopWindowRefs.current.cwInfo = element;
          }}
          style={{
            left: `${windowPositions.cwInfo.x}px`,
            top: `${windowPositions.cwInfo.y}px`,
            zIndex: 20 + windowOrder.indexOf('cwInfo'),
          }}
          onPointerDown={() => activateWindow('cwInfo')}
        >
          <div
            className="title-bar cw-window-title-bar"
            onPointerDown={(event) => handleWindowTitleBarPointerDown(event, 'cwInfo')}
            onPointerMove={handleWindowTitleBarPointerMove}
            onPointerUp={handleWindowTitleBarPointerUp}
            onPointerCancel={stopWindowDrag}
          >
            <div className="title-bar-text">Command Prompt</div>
            <div className="title-bar-controls">
              <button
                aria-label="Minimize"
                onClick={() => {
                  stopWindowDrag();
                  setWindowMinimized('cwInfo', true);
                }}
              ></button>
              <button
                aria-label="Maximize"
                onClick={() => {
                  stopWindowDrag();
                  toggleWindowMaximized('cwInfo');
                }}
              ></button>
              <button
                aria-label="Close"
                onClick={() => {
                  stopWindowDrag();
                  setWindowOpen('cwInfo', false);
                }}
              ></button>
            </div>
          </div>

          <div className="window-body cw-window-body">
            <pre className="terminal-prompt cw-terminal-prompt">C:\CW\UNG&gt; neofetch.exe</pre>
            <div className="cw-neofetch">
              <pre className="cw-ascii-art" aria-hidden="true">
                {cwArt.join('\n')}
              </pre>
              <div className="cw-neofetch-details">
                <p className="cw-neofetch-title">cw@ung</p>
                <div className="cw-neofetch-rule" aria-hidden="true"></div>
                {cwInfoRows.map((row) => (
                  <p key={row.label} className="cw-neofetch-row">
                    <span className="cw-neofetch-label">{row.label}</span>
                    <span className="cw-neofetch-separator">:</span>
                    <span className="cw-neofetch-value">{row.value}</span>
                  </p>
                ))}
                <div className="cw-color-swatches" aria-hidden="true">
                  <span className="cw-swatch cw-swatch--blue"></span>
                  <span className="cw-swatch cw-swatch--green"></span>
                  <span className="cw-swatch cw-swatch--gold"></span>
                  <span className="cw-swatch cw-swatch--silver"></span>
                </div>
                <div className="cw-color-swatches cw-color-swatches--bright" aria-hidden="true">
                  <span className="cw-swatch cw-swatch--navy"></span>
                  <span className="cw-swatch cw-swatch--teal"></span>
                  <span className="cw-swatch cw-swatch--amber"></span>
                  <span className="cw-swatch cw-swatch--ice"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {openWindows.hacklonega && !minimizedWindows.hacklonega && (
        <div
          className={`window homepage-window hacklonega-window${maximizedWindows.hacklonega ? ' is-maximized' : ''}`}
          ref={(element) => {
            desktopWindowRefs.current.hacklonega = element;
          }}
          style={{
            left: `${windowPositions.hacklonega.x}px`,
            top: `${windowPositions.hacklonega.y}px`,
            zIndex: 20 + windowOrder.indexOf('hacklonega'),
          }}
          onPointerDown={() => activateWindow('hacklonega')}
        >
          <div
            className="title-bar hacklonega-window-title-bar"
            onPointerDown={(event) => handleWindowTitleBarPointerDown(event, 'hacklonega')}
            onPointerMove={handleWindowTitleBarPointerMove}
            onPointerUp={handleWindowTitleBarPointerUp}
            onPointerCancel={stopWindowDrag}
          >
            <span className="hacklonega-titlebar-icon">
              <HacklonegaNgMark />
            </span>
            <div className="title-bar-text">C:\CODEHAWKS\HACKLONEGA.EXE</div>
            <div className="title-bar-controls">
              <button
                aria-label="Minimize"
                onClick={() => {
                  stopWindowDrag();
                  setWindowMinimized('hacklonega', true);
                }}
              ></button>
              <button
                aria-label="Maximize"
                onClick={() => {
                  stopWindowDrag();
                  toggleWindowMaximized('hacklonega');
                }}
              ></button>
              <button
                aria-label="Close"
                onClick={() => {
                  stopWindowDrag();
                  setWindowOpen('hacklonega', false);
                }}
              ></button>
            </div>
          </div>

          <div className="window-body hacklonega-window-body">
            <HacklonegaAd />
          </div>
        </div>
      )}

      <div className="xp-taskbar" role="navigation" aria-label="Desktop taskbar">
        <div className="xp-start-menu-container" ref={startMenuRef}>
          <button
            className="xp-taskbar__start"
            type="button"
            aria-label="Start"
            aria-haspopup="menu"
            aria-expanded={isStartMenuOpen}
            onClick={() => setIsStartMenuOpen((currentValue) => !currentValue)}
          >
            <span className="xp-taskbar__start-flag" aria-hidden="true"></span>
            <span className="xp-taskbar__start-text">start</span>
          </button>
          {isStartMenuOpen && (
            <nav className="xp-start-menu" aria-label="UNG club links">
              <div className="xp-start-menu__header">UNG Connect</div>
              <div className="xp-start-menu__items">
                {startMenuLinks.map((item) => (
                  <a
                    key={item.id}
                    className="xp-start-menu__item"
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsStartMenuOpen(false)}
                  >
                    <span className={`xp-start-menu__item-icon xp-start-menu__item-icon--${item.iconType}`} aria-hidden="true"></span>
                    <span className="xp-start-menu__item-label">{item.label}</span>
                  </a>
                ))}
              </div>
            </nav>
          )}
        </div>
        <div className="xp-taskbar__windows" role="toolbar" aria-label="Open windows">
          {DESKTOP_WINDOW_ORDER.filter((windowId) => openWindows[windowId]).map((windowId) => {
            const isMinimized = minimizedWindows[windowId];
            const isActive = activeWindowId === windowId && !isMinimized;

            return (
              <button
                key={windowId}
                className={`xp-taskbar__window-button${isActive ? ' is-active' : ''}${isMinimized ? ' is-minimized' : ''}`}
                type="button"
                onClick={() => handleTaskbarWindowToggle(windowId)}
                title={WINDOW_DISPLAY_NAMES[windowId]}
                aria-pressed={isActive}
              >
                {WINDOW_DISPLAY_NAMES[windowId]}
              </button>
            );
          })}
        </div>
        <LegalFooter compact />
        <div className="xp-taskbar__clock" aria-label="System tray">
          <span className="xp-taskbar__network" aria-hidden="true">
            <span className="xp-taskbar__network-bar xp-taskbar__network-bar--1"></span>
            <span className="xp-taskbar__network-bar xp-taskbar__network-bar--2"></span>
            <span className="xp-taskbar__network-bar xp-taskbar__network-bar--3"></span>
            <span className="xp-taskbar__network-bar xp-taskbar__network-bar--4"></span>
          </span>
          <span className="xp-taskbar__tray-icon xp-taskbar__tray-icon--volume" aria-hidden="true"></span>
          <span className="xp-taskbar__tray-icon xp-taskbar__tray-icon--shield" aria-hidden="true"></span>
          <span className="xp-taskbar__tray-icon xp-taskbar__tray-icon--messenger" aria-hidden="true"></span>
          <NighthawkMascot boundsRef={desktopRef} />
          <time className="xp-taskbar__time" dateTime={new Date().toISOString()}>
            {trayTime}
          </time>
        </div>
      </div>
    </div>
  );
};

export default Homepage;
