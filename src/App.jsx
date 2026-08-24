import './App.css'
import Homepage from './pages/Homepage'
import AccessibilityPage from './pages/AccessibilityPage'
import MembersPage from './pages/MembersPage'
import NotFoundPage from './pages/NotFoundPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import SubprocessorsPage from './pages/SubprocessorsPage'
import TermsPage from './pages/TermsPage'
import "xp.css/dist/XP.css";

function App() {
  const pathname = window.location.pathname === '/'
    ? '/'
    : window.location.pathname.replace(/\/+$/, '')

  const homepageRoutes = {
    '/': 'home',
    '/home': 'home',
    '/projects': 'projects',
    '/team': 'team',
    '/profile': 'profile',
    '/notifications': 'notifications',
    '/manage/events': 'event-manager',
  }

  let page
  if (Object.prototype.hasOwnProperty.call(homepageRoutes, pathname)) {
    page = <Homepage initialRoute={homepageRoutes[pathname]} />
  } else if (pathname === '/members') {
    page = <MembersPage />
  } else if (pathname === '/privacy') {
    page = <PrivacyPolicyPage />
  } else if (pathname === '/terms') {
    page = <TermsPage />
  } else if (pathname === '/subprocessors') {
    page = <SubprocessorsPage />
  } else if (pathname === '/accessibility') {
    page = <AccessibilityPage />
  } else {
    page = <NotFoundPage />
  }

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      {page}
    </>
  )
}

export default App
