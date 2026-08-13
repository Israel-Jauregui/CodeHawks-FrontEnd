import type { Project } from '../types/clubData';
import ResourceImage from './ResourceImage';
import './ProjectCard.css';

interface ProjectCardProps {
  project: Project;
  onRequestJoin?: () => void;
  isRequestJoinDisabled?: boolean;
}

export default function ProjectCard({
  project,
  onRequestJoin,
  isRequestJoinDisabled = false,
}: ProjectCardProps) {
  return (
    <fieldset className="project-card">
      <legend>{project.name}</legend>
      <div className="project-card__content">
        <ResourceImage imageUrl={project.imageUrl} alt={`${project.name} project`} className="project-card__image" />
        <h3>{project.name}</h3>
        <p>{project.description}</p>

        {project.techStack.length > 0 && (
          <div className="project-card__meta-row">
            <span className="project-card__meta-label">Tech Stack</span>
            <div className="project-card__members" aria-label={`Technology used by ${project.name}`}>
              {project.techStack.map((technology) => (
                <span key={technology} className="project-card__member-pill">{technology}</span>
              ))}
            </div>
          </div>
        )}

        <div className="project-card__meta-row">
          <span className="project-card__meta-label">Team Members</span>
          <div className="project-card__members" aria-label={`Team members for ${project.name}`}>
            {project.memberHandles.length > 0 ? project.memberHandles.map((handle) => (
              <span key={handle} className="project-card__member-pill">@{handle}</span>
            )) : <span>Recruiting now</span>}
          </div>
        </div>

        <div className="project-card__actions">
          {project.repoUrl ? (
            <a
              className="project-card__repo-link"
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Repository
            </a>
          ) : (
            <span className="project-card__repo-link project-card__repo-link--disabled">
              Repository coming soon
            </span>
          )}

          {project.demoUrl && (
            <a
              className="project-card__repo-link"
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              View Demo
            </a>
          )}

          {onRequestJoin && (
            <button
              type="button"
              className="project-card__join-button"
              onClick={onRequestJoin}
              disabled={isRequestJoinDisabled}
            >
              Request to Join
            </button>
          )}
        </div>
      </div>
    </fieldset>
  );
}
