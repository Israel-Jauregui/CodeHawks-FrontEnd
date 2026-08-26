import { useEffect } from 'react';
import type { ResourceType } from '../../types/clubData';
import MembersDirectory from '../MembersDirectory';
import BrowserErrorBoundary from './BrowserErrorBoundary';
import type { BrowserRoute } from './hooks/useBrowserNavigation';
import HomeModule from './modules/HomeModule';
import EventManagerModule from './modules/EventManagerModule';
import NotificationsModule from './modules/NotificationsModule';
import ProfileModule from './modules/ProfileModule';
import ProjectsModule from './modules/ProjectsModule';
import TeamModule from './modules/TeamModule';

const ROUTE_HEADINGS: Record<BrowserRoute, string> = {
  home: 'CodeHawks at the University of North Georgia',
  projects: 'CodeHawks projects',
  team: 'CodeHawks teams',
  members: 'CodeHawks public members',
  profile: 'Your CodeHawks profile',
  notifications: 'Your CodeHawks notifications',
  'event-manager': 'CodeHawks event manager',
};

interface BrowserContentHostProps {
  route: BrowserRoute;
  sectionScrollTarget: string | null;
  onSectionScrollHandled: () => void;
  onNavigateRoute: (route: BrowserRoute) => void;
}

export default function BrowserContentHost({
  route,
  sectionScrollTarget,
  onSectionScrollHandled,
  onNavigateRoute,
}: BrowserContentHostProps) {
  useEffect(() => {
    if (route !== 'home' || !sectionScrollTarget) return;
    document.getElementById(sectionScrollTarget)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    onSectionScrollHandled();
  }, [onSectionScrollHandled, route, sectionScrollTarget]);

  const openResource = (resourceType: ResourceType) => {
    // The list routes are the closest current virtual-browser destination.
    // The UUID remains available to a future detail route without parsing notification text.
    onNavigateRoute(resourceType === 'project' ? 'projects' : 'team');
  };

  return (
    <main id="main-content" tabIndex={-1} className="ie6-content-viewport">
      <h1 className="visually-hidden">{ROUTE_HEADINGS[route]}</h1>
      <BrowserErrorBoundary resetKey={route}>
        {route === 'home' && <HomeModule />}
        {route === 'projects' && <ProjectsModule />}
        {route === 'team' && <TeamModule />}
        {route === 'members' && <MembersDirectory />}
        {route === 'profile' && <ProfileModule />}
        {route === 'notifications' && <NotificationsModule onOpenResource={openResource} />}
        {route === 'event-manager' && <EventManagerModule />}
      </BrowserErrorBoundary>
    </main>
  );
}
