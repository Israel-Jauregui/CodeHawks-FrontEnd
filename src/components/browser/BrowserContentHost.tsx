import { useEffect } from 'react';
import type { BrowserRoute } from './hooks/useBrowserNavigation';
import HomeModule from './modules/HomeModule';
import ProjectsModule from './modules/ProjectsModule';
import TeamModule from './modules/TeamModule';

interface BrowserContentHostProps {
  route: BrowserRoute;
  sectionScrollTarget: string | null;
  onSectionScrollHandled: () => void;
}

export default function BrowserContentHost({
  route,
  sectionScrollTarget,
  onSectionScrollHandled,
}: BrowserContentHostProps) {
  useEffect(() => {
    if (route !== 'home' || !sectionScrollTarget) {
      return;
    }

    const scrollTargetElement = document.getElementById(sectionScrollTarget);

    if (scrollTargetElement) {
      scrollTargetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    onSectionScrollHandled();
  }, [onSectionScrollHandled, route, sectionScrollTarget]);

  return (
    <div className="ie6-content-viewport">
      {route === 'home' && <HomeModule />}
      {route === 'projects' && <ProjectsModule />}
      {route === 'team' && <TeamModule />}
    </div>
  );
}
