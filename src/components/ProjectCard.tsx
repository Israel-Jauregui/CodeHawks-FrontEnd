import type { ProjectWithMembers } from '../hooks/useProjectsData';
import './ProjectCard.css';

interface ProjectCardProps {
  project: ProjectWithMembers;
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
      <legend>Project #{project.projectId}</legend>
      <div className="project-card__content">
        <h3>{project.projectName}</h3>
        <p>{project.projectDesc}</p>

        <div className="project-card__meta-row">
          <span className="project-card__meta-label">Team Members</span>
          <div className="project-card__members" aria-label={`Team members for ${project.projectName}`}>
            {project.members.map((member) => (
              <span key={member.username} className="project-card__member-pill">
                {member.fullname}
              </span>
            ))}
          </div>
        </div>

        <div className="project-card__actions">
          {project.repoLink ? (
            <a
              className="project-card__repo-link"
              href={project.repoLink}
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
