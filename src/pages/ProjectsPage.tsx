import TopAppBar from '../components/TopAppBar';
import ProjectsModule from '../components/browser/modules/ProjectsModule';
import './ProjectsPage.css';

/**
 * Kept as a standalone preview surface for contributors. The production app
 * renders the same module inside Homepage's virtual Internet Explorer window.
 */
export default function ProjectsPage() {
  return (
    <div className="projects-page-root">
      <div className="window projects-page-window">
        <TopAppBar title="ADC Projects" showAuthButton={false} />
        <div className="window-body projects-page-body">
          <ProjectsModule />
        </div>
        <div className="status-bar projects-page-status-bar">
          <p className="status-bar-field">Projects</p>
          <p className="status-bar-field">CodeHawks data provider</p>
          <p className="status-bar-field">Ready</p>
        </div>
      </div>
    </div>
  );
}
