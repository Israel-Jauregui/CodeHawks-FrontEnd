import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { canManageEvents } from '../auth/permissions';
import { SITE_IDENTITY } from '../constants/site';
import type { BrowserRoute } from './browser/hooks/useBrowserNavigation';
import './TopAppBar.css';

/**
 * TopAppBar — IE7-style browser chrome (XP grey, no Aero).
 *
 * HOW IT WORKS (React patterns explained):
 * -----------------------------------------
 * 1. **Props with defaults**: The `title` prop has a default value via
 *    destructuring (`title = 'University of North Georgia'`). If the parent
 *    component doesn't pass a `title`, we fall back to the default. This is
 *    a common pattern to make components flexible without requiring every prop.
 *
 * 2. **useState for mobile menu**: `isMobileMenuOpen` is a boolean piece of
 *    React *state*. When we call `setIsMobileMenuOpen`, React re-renders this
 *    component with the new value. The mobile nav slides open/closed as a
 *    result — no manual DOM manipulation needed.
 *
 * 3. **Conditional rendering**: The mobile menu JSX is only included in the
 *    output when `isMobileMenuOpen` is true (`{isMobileMenuOpen && (...)}`).
 *    React will mount/unmount those DOM nodes automatically.
 *
 * 4. **Data-driven rendering with .map()**: The nav links and external links
 *    are defined as arrays and rendered with `.map()`. This is a core React
 *    pattern — instead of copy/pasting markup, you describe the *data* and
 *    let React generate the DOM. Each mapped element needs a unique `key`
 *    prop so React can efficiently track which items changed, were added, or
 *    removed during re-renders.
 *
 * LAYOUT (IE7 browser metaphor, XP grey chrome):
 *   ┌──────────────────────────────────────────────────────────────────────┐
 *   │ [title-bar] App Development Club at UNG  [Join Now] [_] [□] [X]   │
 *   ├──────────────────────────────────────────────────────────────────────┤
 *   │ [◄ Back▾][►] [✕][↻][⌂][⌕][☆][⧖] │ Home About Events ... Contact  │
 *   ├──────────────────────────────────────────────────────────────────────┤
 *   │ Address [https://codehawks.org] [CodeHawks Search ⌕] Git Dis UNG [P][T]│
 *   └──────────────────────────────────────────────────────────────────────┘
 *
 * CONSOLIDATION (IE6 → IE7):
 * The previous IE6 layout had 3 grey toolbar rows (nav menu, standard
 * buttons, address+links). This IE7-inspired refactor condenses them
 * into 2 rows: a navigation row and an address/search/utility row.
 * All browser-chrome buttons (Back, Forward, Stop, Refresh, Home,
 * Search, Favorites, History) are purely decorative — they exist for
 * the retro aesthetic and have no click handlers or navigation logic.
 */

interface TopAppBarProps {
  /** Text displayed in the XP title bar */
  title?: string;
  /** Callback fired when the user clicks the Close (X) button. */
  onClose?: () => void;
  /** Callback fired when the user clicks the Minimize (_) button. */
  onMinimize?: () => void;
  /** Callback fired when the user clicks the Maximize (□) button. */
  onMaximize?: () => void;
  /** Pointer handler for dragging the outer desktop window by its title bar. */
  onTitleBarPointerDown?: React.PointerEventHandler<HTMLDivElement>;
  /** Pointer handler for dragging updates while the pointer is captured. */
  onTitleBarPointerMove?: React.PointerEventHandler<HTMLDivElement>;
  /** Pointer handler for ending a drag interaction cleanly. */
  onTitleBarPointerUp?: React.PointerEventHandler<HTMLDivElement>;
  /** Pointer handler for canceled drags (browser interruptions, lost capture). */
  onTitleBarPointerCancel?: React.PointerEventHandler<HTMLDivElement>;
  /** Callback fired when Login is clicked. */
  onLoginClick?: () => void;
  /** Hide login dropdown/button for standalone pages like Projects. */
  showAuthButton?: boolean;
  /** Navigate to an internal browser route. */
  onNavigateRoute?: (route: BrowserRoute) => void;
  /** Navigate to an in-page section within the home module. */
  onNavigateSection?: (sectionId: 'about' | 'events' | 'contact') => void;
  /** Browser history back action. */
  onBack?: () => void;
  /** Browser history forward action. */
  onForward?: () => void;
  /** Whether browser back is currently available. */
  canGoBack?: boolean;
  /** Whether browser forward is currently available. */
  canGoForward?: boolean;
  /** Current browser address shown in the address bar. */
  currentAddress?: string;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  title = `${SITE_IDENTITY.currentClubName} at ${SITE_IDENTITY.universityName}`,
  onClose,
  onMinimize,
  onMaximize,
  onTitleBarPointerDown,
  onTitleBarPointerMove,
  onTitleBarPointerUp,
  onTitleBarPointerCancel,
  onLoginClick,
  showAuthButton = true,
  onNavigateRoute,
  onNavigateSection,
  onBack,
  onForward,
  canGoBack = false,
  canGoForward = false,
  currentAddress = 'https://codehawks.org/',
}) => {
  const { user, isLoading: isAuthLoading, logout, unreadCount } = useAuth();
  // Dropdown state for user menu
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  // ── State ──────────────────────────────────────────────────────
  // Controls whether the mobile hamburger menu is expanded.
  // `useState` returns a [value, setter] tuple. React re-renders whenever
  // the setter is called with a new value.
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    // Using the functional form of the setter: React passes us the *current*
    // state (`prev`), and we return the next state. This is safer than
    // `setIsMobileMenuOpen(!isMobileMenuOpen)` when multiple rapid updates
    // could happen, because it avoids stale-closure bugs.
    setIsMobileMenuOpen((prev) => !prev);
  };

  // ── Data Arrays ────────────────────────────────────────────────
  // Navigation links — defined once and reused in both desktop & mobile menus.
  const navLinks = [
    { key: 'home', label: 'Home', onClick: () => onNavigateRoute?.('home') },
    { key: 'about', label: 'About', onClick: () => onNavigateSection?.('about') },
    { key: 'events', label: 'Events', onClick: () => onNavigateSection?.('events') },
    { key: 'projects', label: 'Projects', onClick: () => onNavigateRoute?.('projects') },
    { key: 'team', label: 'Team', onClick: () => onNavigateRoute?.('team') },
    { key: 'members', label: 'Members', onClick: () => onNavigateRoute?.('members') },
    { key: 'contact', label: 'Contact', onClick: () => onNavigateSection?.('contact') },
  ];

  // External links — always visible and clickable in the utility area.
  const externalLinks = [
    { href: 'https://github.com/UNG-Mobile-App-Development-Club', label: 'GitHub' },
    { href: 'https://discord.com', label: 'Discord' },
    { href: 'https://ung.edu', label: 'UNG' },
  ];

  return (
    <header className="top-app-bar">
      {/* ── XP Title Bar ──────────────────────────────────────────
       * The title bar uses flexbox (set by xp.css) with three children:
       *
       *   1. `.title-bar-text`   — window title (gets margin-right: auto
       *                            via our CSS, pushing everything else
       *                            to the far right)
       *   2. `.join-button`      — compact CTA styled as a standard grey
       *                            xp.css button
       *   3. `.title-bar-controls` — Minimize / Maximize / Close
       *
       * WHY IS "JOIN NOW" OUTSIDE `.title-bar-controls`?
       * xp.css applies special SVG background-image icons to buttons
       * inside `.title-bar-controls` based on their `aria-label`. If we
       * put "Join Now" in there, it would inherit those SVG styles and
       * potentially break the window-control icons. Keeping it as a
       * sibling gives us full styling control without side effects.
       *
       * REACT CONCEPT — Optional Chaining on Callbacks:
       * The Close button uses `onClick={onClose}`. If `onClose` is
       * undefined (the parent didn't pass it), React simply ignores
       * the click — no error, no crash. This is safe because React
       * treats `undefined` event handlers as "no handler attached".
       */}
      <div
        className="title-bar"
        onPointerDown={onTitleBarPointerDown}
        onPointerMove={onTitleBarPointerMove}
        onPointerUp={onTitleBarPointerUp}
        onPointerCancel={onTitleBarPointerCancel}
      >
        <div className="title-bar-text">{title}</div>
        {showAuthButton && (user ? (
          <div className="user-dropdown-wrapper">
            <button
              className="join-button"
              onClick={() => setUserMenuOpen((v) => !v)}
              aria-haspopup="true"
              aria-expanded={userMenuOpen}
            >
              @{user.handle}{unreadCount > 0 ? ` (${unreadCount})` : ''}
            </button>
            {userMenuOpen && (
              <div className="user-dropdown-menu" onMouseLeave={() => setUserMenuOpen(false)}>
                <div className="user-dropdown-summary">
                  <strong>{user.displayName}</strong>
                  <span>{user.role.replaceAll('_', ' ')}</span>
                </div>
                <button
                  className="user-dropdown-item"
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onNavigateRoute?.('profile');
                  }}
                >
                  View profile
                </button>
                <button
                  className="user-dropdown-item"
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onNavigateRoute?.('notifications');
                  }}
                >
                  Notifications{unreadCount > 0 ? ` (${unreadCount})` : ''}
                </button>
                {canManageEvents(user.role) && (
                  <button
                    className="user-dropdown-item"
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      onNavigateRoute?.('event-manager');
                    }}
                  >
                    Manage events
                  </button>
                )}
                <button
                  className="user-dropdown-item"
                  onClick={() => {
                    setUserMenuOpen(false);
                    void logout();
                  }}
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button className="join-button" onClick={onLoginClick} disabled={isAuthLoading}>
            {isAuthLoading ? 'Connecting...' : 'Login'}
          </button>
        ))}
        <div className="title-bar-controls">
          <button aria-label="Minimize" onClick={onMinimize}></button>
          <button aria-label="Maximize" onClick={onMaximize}></button>
          <button aria-label="Close" onClick={onClose}></button>
        </div>
      </div>

      {/* ── Row 1: Consolidated Navigation ────────────────────────
       * Merges the old IE6 menu bar and standard-buttons toolbar into
       * a single row. This follows the IE7 design principle of putting
       * browser navigation controls and site navigation on one line.
       *
       * IMPORTANT — Decorative browser chrome:
       * The Back, Forward, Stop, Refresh, Home, Search, Favorites,
       * and History buttons are purely decorative. They exist for the
       * retro IE aesthetic only — no click handlers are attached.
       * Only the site nav links (Home, About, etc.) are functional
       * hash-anchor links.
       *
       * LAYOUT WITHIN THIS ROW:
       *   [◄ Back ▾] [►]  — large, prominent (IE7 made these bigger)
       *   [✕] [↻] [⌂] [⌕] [☆] [⧖]  — small icon-only buttons
       *   │ separator
       *   Home  About  Events  Projects  Team  Contact  — functional nav
       */}
      <div className="ie7-nav-row">
        {/* ── Large Back / Forward buttons ─────────────────────── */}
        <button
          className="ie7-nav-btn ie7-nav-btn--back"
          title="Back"
          aria-label="Back"
          onClick={onBack}
          disabled={!canGoBack}
        >
          <span className="ie7-nav-btn__icon">{'\u25C4'}</span>
          <span className="ie7-nav-btn__label">Back</span>
          <span className="ie7-nav-btn__dropdown">{'\u25BE'}</span>
        </button>
        <button
          className="ie7-nav-btn ie7-nav-btn--forward"
          title="Forward"
          aria-label="Forward"
          onClick={onForward}
          disabled={!canGoForward}
        >
          <span className="ie7-nav-btn__icon">{'\u25BA'}</span>
        </button>

        {/* ── Small icon-only buttons ─────────────────────────────
         * These replicate the classic toolbar chrome. Each button is
         * a compact square with a Unicode glyph standing in for the
         * original 16×16 icon sprites.
         */}
        <div className="ie7-nav-small-group">
          <span className="ie7-nav-small-btn" aria-hidden="true">{'\u00D7'}</span>
          <span className="ie7-nav-small-btn" aria-hidden="true">{'\u21BB'}</span>
          <span className="ie7-nav-small-btn" aria-hidden="true">{'\u2302'}</span>
          <span className="ie7-nav-small-btn" aria-hidden="true">{'\u2315'}</span>
          <span className="ie7-nav-small-btn" aria-hidden="true">{'\u2606'}</span>
          <span className="ie7-nav-small-btn" aria-hidden="true">{'\u29D6'}</span>
        </div>

        {/* ── Separator ───────────────────────────────────────────
         * Thin vertical etched groove separating browser chrome
         * from site navigation. Classic XP 1px shadow + highlight.
         */}
        <span className="toolbar-separator" />

        {/* ── Site Navigation Links ───────────────────────────────
         * These are the only functional elements in this row.
         * Each is a hash-anchor link for in-page navigation.
         *
         * REACT CONCEPT — .map() for lists:
         * We iterate over the `navLinks` array and produce one <a>
         * per entry. The `key` prop (set to `link.href`) tells React
         * which DOM node corresponds to which data item, enabling
         * efficient re-renders when the list changes.
         */}
        <nav className="ie7-site-nav">
          {navLinks.map((link) => (
            <button key={link.key} type="button" className="nav-link" onClick={link.onClick}>
              {link.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Row 2: Address + Search + Utility ─────────────────────
       * Combines the address bar, a decorative search box, the
       * always-visible external links, and IE7-style utility buttons
       * onto a single row.
       *
       * LAYOUT WITHIN THIS ROW:
       *   Address [https://codehawks.org             ]
       *   [CodeHawks Search ⌕]
       *   GitHub  Discord  UNG  — real external links (always visible)
       *   [Page ▾] [Tools ▾]   — decorative dropdown buttons
       *
       * REACT CONCEPT — readOnly vs disabled:
       * The address input uses `readOnly` so users can select/copy
       * the URL text but can't edit it. `disabled` would gray it out
       * and prevent all interaction — we want copyable text.
       */}
      <div className="ie7-address-row">
        {/* ── Address section ─────────────────────────────────── */}
        <label className="ie7-address-row__label" htmlFor="codehawks-current-address">Address</label>
        <input
          id="codehawks-current-address"
          type="text"
          className="ie7-address-row__input"
          value={currentAddress}
          readOnly
        />

        {/* ── Search section (decorative) ─────────────────────── */}
        <div className="ie7-search" aria-hidden="true">
          <span className="ie7-search__input">CodeHawks Search</span>
          <span className="ie7-search__btn">{'\u2315'}</span>
        </div>

        {/* ── Utility cluster ─────────────────────────────────────
         * External links are always visible and functional. The
         * Page/Tools buttons are decorative IE7 chrome — they mimic
         * the dropdown menus from the reference image but have no
         * click handlers wired up.
         */}
        <div className="ie7-utility-cluster">
          {externalLinks.map((item, index) => (
            <React.Fragment key={item.href}>
              {index > 0 && <span className="ie7-utility-divider">|</span>}
              <a
                href={item.href}
                className="ie7-utility-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.label}
              </a>
            </React.Fragment>
          ))}
          <span className="ie7-utility-divider">|</span>
          <span className="ie7-utility-btn" aria-hidden="true">Page {'\u25BE'}</span>
          <span className="ie7-utility-btn" aria-hidden="true">Tools {'\u25BE'}</span>
        </div>
      </div>

      {/* ── Mobile Hamburger Toggle ──────────────────────────────
       * Only visible on narrow viewports (hidden via CSS on desktop).
       */}
      <button
        className="mobile-menu-toggle"
        onClick={toggleMobileMenu}
        aria-label="Toggle menu"
        aria-expanded={isMobileMenuOpen}
      >
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>

      {/* ── Mobile Menu ───────────────────────────────────────────
       * Conditionally rendered: React only creates these DOM nodes when
       * `isMobileMenuOpen` is `true`. When it flips to `false`, React
       * removes them from the DOM entirely (unmounts).
       */}
      {isMobileMenuOpen && (
        <div className="mobile-menu">
          {navLinks.map((link) => (
            <button key={link.key} type="button" className="nav-link" onClick={link.onClick}>
              {link.label}
            </button>
          ))}
          <div className="mobile-menu-links">
            {externalLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="nav-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.label}
              </a>
            ))}
          </div>
          {showAuthButton && (
            <div className="mobile-menu-action">
              {user ? (
                <div className="mobile-auth-actions">
                  <strong>@{user.handle}</strong>
                  <button type="button" className="nav-link" onClick={() => onNavigateRoute?.('profile')}>View profile</button>
                  <button type="button" className="nav-link" onClick={() => onNavigateRoute?.('notifications')}>Notifications ({unreadCount})</button>
                  {canManageEvents(user.role) && <button type="button" className="nav-link" onClick={() => onNavigateRoute?.('event-manager')}>Manage events</button>}
                  <button type="button" className="nav-link" onClick={() => void logout()}>Log out</button>
                </div>
              ) : (
                <button className="join-button" onClick={onLoginClick} disabled={isAuthLoading}>Login</button>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default TopAppBar;
