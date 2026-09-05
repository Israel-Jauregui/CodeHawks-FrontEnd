import { useState } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { useTeamsData } from '../../../hooks/useTeamsData';
import { isUsingLocalData } from '../../../services/clubDataProvider';
import { validateImageFile } from '../../../services/mediaUpload';
import type { CreateTeamInput, TeamCategory } from '../../../types/clubData';
import ResourceImagePicker from '../../ResourceImagePicker';
import TeamCard from '../../TeamCard';
import ResourceWorkspace from '../../ResourceWorkspace';
import type { ManagedResource } from '../../../services/resourceManagement';
import './TeamModule.css';

const EMPTY_FORM: CreateTeamInput = {
  name: '',
  description: '',
  category: 'project',
  joinPolicy: 'approval_required',
  maxMembers: 6,
};

export default function TeamModule({ selectedId }: { selectedId?: string }) {
  const { isAuthenticated, user } = useAuth();
  const [created, setCreated] = useState<ManagedResource>();
  const canUseMemberFeatures = isUsingLocalData || isAuthenticated;
  const { teams, isLoading, isSaving, isJoining, error, saveError, joinError, reload, createTeam, joinTeam } = useTeamsData();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState<CreateTeamInput>(EMPTY_FORM);
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [joinMessages, setJoinMessages] = useState<Record<string, string>>({});

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    setMessage(null);
    setFormError(null);
    const imageError = validateImageFile(form.imageFile);
    if (imageError) {
      setFormError(imageError);
      return;
    }
    const result = await createTeam({ ...form, name: form.name.trim(), description: form.description.trim() });
    if (!result) return;
    if (user) setCreated({ ...result.team, ownerId: user.id });
    const imageMessage = result.imageUploadError
      ? ` ${result.imageUploadError}`
      : form.imageFile ? ' Team image uploaded.' : '';
    setMessage(`Team “${result.team.name}” was created.${imageMessage}`);
    setForm(EMPTY_FORM);
    setIsCreateOpen(false);
  };

  const handleJoin = async (teamId: string) => {
    if (!canUseMemberFeatures) {
      setJoinMessages((current) => ({ ...current, [teamId]: 'Log in with your UNG Microsoft account to join.' }));
      return;
    }
    const status = await joinTeam(teamId);
    if (!status) return;
    const labelByStatus = {
      joined: 'You joined the team.',
      requested: 'Your join request was sent to the team owner.',
      'already-member': 'You are already a member of this team.',
      'already-requested': 'You already requested to join this team.',
    };
    setJoinMessages((current) => ({ ...current, [teamId]: labelByStatus[status] }));
  };

  return (
    <section className="team-module" id="team">
      <h2>Team Workspace</h2>
      <ResourceWorkspace type="team" selectedId={selectedId} created={created?.ownerId === user?.id ? created : undefined} onChanged={reload} />
      <p className="team-module__subtitle">Find a competition, study, or project team—or create one for other CodeHawks.</p>
      <div className="team-module__toolbar">
        {canUseMemberFeatures && <button type="button" onClick={() => setIsCreateOpen((open) => !open)}>{isCreateOpen ? 'Close Form' : 'Create Team'}</button>}
        <button type="button" onClick={() => void reload()} disabled={isLoading}>Refresh</button>
      </div>

      {!canUseMemberFeatures && <fieldset className="team-module__feedback"><legend>Member Tools</legend><p>Sign in to create or join a team.</p></fieldset>}
      {message && <fieldset className="team-module__feedback team-module__feedback--success" role="status" aria-live="polite"><legend>Saved</legend><p>{message}</p></fieldset>}
      {(formError || saveError || joinError) && <fieldset className="team-module__feedback team-module__feedback--error" role="alert"><legend>Action Failed</legend><p>{formError || saveError || joinError}</p></fieldset>}

      {isCreateOpen && canUseMemberFeatures && (
        <fieldset className="team-module__form-wrapper">
          <legend>New Team</legend>
          <form className="team-module__form" onSubmit={handleSubmit}>
            <label><span>Team Name *</span><input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} maxLength={100} required /></label>
            <label className="team-module__full"><span>Description *</span><textarea rows={4} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} maxLength={3000} required /></label>
            <label><span>Category</span><select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as TeamCategory }))}>
              <option value="hackathon">Hackathon</option><option value="ctf">CTF</option><option value="project">Project</option><option value="study_group">Study Group</option><option value="other">Other</option>
            </select></label>
            <label><span>Join Policy</span><select value={form.joinPolicy} onChange={(event) => setForm((current) => ({ ...current, joinPolicy: event.target.value as CreateTeamInput['joinPolicy'] }))}>
              <option value="approval_required">Approval Required</option><option value="open">Open Joining</option>
            </select></label>
            <label><span>Maximum Members</span><input type="number" min={2} max={100} value={form.maxMembers} onChange={(event) => setForm((current) => ({ ...current, maxMembers: Number(event.target.value) }))} required /></label>
            <div className="team-module__full">
              <ResourceImagePicker
                file={form.imageFile}
                onFileChange={(imageFile) => setForm((current) => ({ ...current, imageFile }))}
              />
            </div>
            <div className="team-module__actions"><button type="submit" disabled={isSaving}>{isSaving ? 'Creating...' : 'Create Team'}</button></div>
          </form>
        </fieldset>
      )}

      {isLoading && <fieldset className="team-module__feedback"><legend>Loading</legend><p>Loading teams...</p></fieldset>}
      {!isLoading && error && <fieldset className="team-module__feedback team-module__feedback--error"><legend>Error</legend><p>{error}</p></fieldset>}
      {!isLoading && !error && teams.length === 0 && <fieldset className="team-module__feedback"><legend>No Teams</legend><p>No teams are accepting members yet.</p></fieldset>}
      {!isLoading && !error && teams.length > 0 && (
        <div className="team-module__grid">
          {teams.map((team) => (
            <div key={team.id}>
              <TeamCard team={team} onJoin={() => void handleJoin(team.id)} isJoining={isJoining} />
              {joinMessages[team.id] && <p className="team-module__join-message" role="status">{joinMessages[team.id]}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
