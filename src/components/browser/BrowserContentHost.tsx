import { useEffect } from 'react';
import type { ResourceType } from '../../types/clubData';
import BrowserErrorBoundary from './BrowserErrorBoundary';
import type { BrowserRoute } from './hooks/useBrowserNavigation';
import HomeModule from './modules/HomeModule';
import EventManagerModule from './modules/EventManagerModule';
import NotificationsModule from './modules/NotificationsModule';
import ProfileModule from './modules/ProfileModule';
import ProjectsModule from './modules/ProjectsModule';
import TeamModule from './modules/TeamModule';

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
    <div className="ie6-content-viewport">
      <BrowserErrorBoundary resetKey={route}>
        {route === 'home' && <HomeModule />}
        {route === 'projects' && <ProjectsModule />}
        {route === 'team' && <TeamModule />}
        {route === 'profile' && <ProfileModule />}
        {route === 'notifications' && <NotificationsModule onOpenResource={openResource} />}
        {route === 'event-manager' && <EventManagerModule />}
      </BrowserErrorBoundary>
    </div>
  );
}
