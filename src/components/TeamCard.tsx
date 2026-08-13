import type { Team } from '../types/clubData';
import ResourceImage from './ResourceImage';
import './TeamCard.css';

interface TeamCardProps {
  team: Team;
  onJoin?: () => void;
  isJoining?: boolean;
}

function titleCase(value: string): string {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function TeamCard({ team, onJoin, isJoining = false }: TeamCardProps) {
  const isFull = team.memberCount >= team.maxMembers;
  const canJoin = team.status === 'open' && !isFull;

  return (
    <fieldset className="team-card">
      <legend>{team.name}</legend>
      <ResourceImage imageUrl={team.imageUrl} alt={`${team.name} team`} className="team-card__image" />
      <div className="team-card__heading">
        <h3>{team.name}</h3>
        <span className={`team-card__status team-card__status--${team.status}`}>{titleCase(team.status)}</span>
      </div>
      <p>{team.description}</p>
      <dl className="team-card__details">
        <div><dt>Category</dt><dd>{titleCase(team.category)}</dd></div>
        <div><dt>Joining</dt><dd>{team.joinPolicy === 'open' ? 'Open' : 'Approval required'}</dd></div>
        <div><dt>Capacity</dt><dd>{team.memberCount} / {team.maxMembers}</dd></div>
      </dl>
      {team.memberHandles.length > 0 && (
        <div className="team-card__members">
          {team.memberHandles.map((handle) => <span key={handle}>@{handle}</span>)}
        </div>
      )}
      {onJoin && (
        <button type="button" onClick={onJoin} disabled={isJoining || !canJoin}>
          {isFull ? 'Team Full' : team.status !== 'open' ? 'Closed' : team.joinPolicy === 'open' ? 'Join Team' : 'Request to Join'}
        </button>
      )}
    </fieldset>
  );
}
