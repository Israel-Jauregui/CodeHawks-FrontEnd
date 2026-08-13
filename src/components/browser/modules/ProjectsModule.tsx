import { useMemo, useRef, useState } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { useProjectsData } from '../../../hooks/useProjectsData';
import { isUsingLocalData } from '../../../services/clubDataProvider';
import { validateImageFile } from '../../../services/mediaUpload';
import type { CreateProjectInput, MemberSummary } from '../../../types/clubData';
import ProjectCard from '../../ProjectCard';
import ResourceImagePicker from '../../ResourceImagePicker';
import './ProjectsModule.css';

interface ProjectFormValues {
  name: string;
  description: string;
  repoUrl: string;
  imageUrl: string;
  demoUrl: string;
  techStack: string;
  submitForReview: boolean;
}

const EMPTY_FORM_VALUES: ProjectFormValues = {
  name: '',
  description: '',
  repoUrl: '',
  imageUrl: '',
  demoUrl: '',
  techStack: '',
  submitForReview: true,
};

function isValidHttpsUrl(value: string): boolean {
  if (!value.trim()) return true;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function optionalValue(value: string): string | undefined {
  return value.trim() || undefined;
}

export default function ProjectsModule() {
  const { isAuthenticated } = useAuth();
  const canUseMemberFeatures = isUsingLocalData || isAuthenticated;
  const {
    projects,
    isLoading,
    error,
    reload,
    addProject,
    isSaving,
    saveError,
    searchMembers,
    isSearchingMembers,
    requestToJoin,
    isRequestingJoin,
    joinError,
  } = useProjectsData();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formValues, setFormValues] = useState<ProjectFormValues>(EMPTY_FORM_VALUES);
  const [memberLookupQuery, setMemberLookupQuery] = useState('');
  const [memberLookupResults, setMemberLookupResults] = useState<MemberSummary[]>([]);
  const [invitedMembers, setInvitedMembers] = useState<MemberSummary[]>([]);
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [joinMessageByProject, setJoinMessageByProject] = useState<Record<string, string>>({});
  const lookupRequestId = useRef(0);

  const handleFormFieldChange = <K extends keyof ProjectFormValues>(
    field: K,
    value: ProjectFormValues[K],
  ) => setFormValues((current) => ({ ...current, [field]: value }));

  const validateForm = (): string | null => {
    if (!formValues.name.trim()) return 'Project name is required.';
    if (!formValues.description.trim()) return 'Project description is required.';
    if (!isValidHttpsUrl(formValues.repoUrl)) return 'Repository link must be a valid HTTPS URL.';
    if (!isValidHttpsUrl(formValues.imageUrl)) return 'Image URL must be a valid HTTPS URL.';
    if (!isValidHttpsUrl(formValues.demoUrl)) return 'Demo URL must be a valid HTTPS URL.';
    const imageError = validateImageFile(imageFile);
    if (imageError) return imageError;
    return null;
  };

  const lookupCandidates = useMemo(() => {
    const invitedIds = new Set(invitedMembers.map((member) => member.id));
    return memberLookupResults.filter((member) => !invitedIds.has(member.id));
  }, [invitedMembers, memberLookupResults]);

  const handleMemberLookup: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const nextQuery = event.target.value;
    const requestId = ++lookupRequestId.current;
    setMemberLookupQuery(nextQuery);
    if (!nextQuery.trim()) {
      setMemberLookupResults([]);
      return;
    }
    try {
      const results = await searchMembers(nextQuery);
      if (requestId === lookupRequestId.current) setMemberLookupResults(results);
    } catch {
      if (requestId === lookupRequestId.current) setMemberLookupResults([]);
    }
  };

  const handleRequestToJoin = async (projectId: string) => {
    if (!canUseMemberFeatures) {
      setJoinMessageByProject((current) => ({
        ...current,
        [projectId]: 'Log in with your UNG Microsoft account to request access.',
      }));
      return;
    }

    const status = await requestToJoin(projectId);
    if (!status) return;
    const label = status === 'requested'
      ? 'Request submitted. The project owner has been notified.'
      : status === 'already-member'
        ? 'You are already a member of this project.'
        : 'You already requested to join this project.';
    setJoinMessageByProject((current) => ({ ...current, [projectId]: label }));
  };

  const handleCreateSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    setSaveMessage(null);
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormError(null);

    const input: CreateProjectInput = {
      name: formValues.name.trim(),
      description: formValues.description.trim(),
      repoUrl: optionalValue(formValues.repoUrl),
      imageUrl: optionalValue(formValues.imageUrl),
      demoUrl: optionalValue(formValues.demoUrl),
      techStack: formValues.techStack.split(',').map((item) => item.trim()).filter(Boolean),
      submitForReview: formValues.submitForReview,
      inviteeIds: invitedMembers.map((member) => member.id),
      ...(imageFile ? { imageFile } : {}),
    };
    const result = await addProject(input);
    if (!result) return;

    const reviewMessage = result.project.status === 'pending_review'
      ? ' It is awaiting officer review before appearing publicly.'
      : ' It was saved as a draft.';
    const invitationMessage = result.invitationErrors.length > 0
      ? ` ${result.invitationErrors.length} invitation(s) could not be sent: ${result.invitationErrors.join(' ')}`
      : invitedMembers.length > 0 ? ' Member invitations were sent.' : '';
    const imageMessage = result.imageUploadError ? ` ${result.imageUploadError}` : imageFile ? ' Project image uploaded.' : '';
    setSaveMessage(`Project “${result.project.name}” was created.${reviewMessage}${imageMessage}${invitationMessage}`);
    setFormValues(EMPTY_FORM_VALUES);
    setInvitedMembers([]);
    setMemberLookupQuery('');
    setMemberLookupResults([]);
    setImageFile(undefined);
    setIsCreateOpen(false);
  };

  return (
    <section className="projects-module">
      <h2 className="projects-module__title">Projects Workspace</h2>
      <p className="projects-module__subtitle">
        Browse published club builds, find collaborators, and submit your next idea.
      </p>

      <div className="projects-module__toolbar">
        {canUseMemberFeatures && (
          <button
            type="button"
            className="projects-module__button"
            onClick={() => {
              setIsCreateOpen((open) => !open);
              setFormError(null);
              setSaveMessage(null);
            }}
          >
            {isCreateOpen ? 'Close Form' : 'Add Project'}
          </button>
        )}
        <button type="button" className="projects-module__button" onClick={() => void reload()} disabled={isLoading}>
          Refresh
        </button>
      </div>

      {!canUseMemberFeatures && (
        <fieldset className="projects-module__feedback">
          <legend>Member Tools</legend>
          <p>Sign in with your UNG Microsoft account to create a project, invite members, or request to join.</p>
        </fieldset>
      )}

      {saveMessage && <fieldset className="projects-module__feedback projects-module__feedback--success"><legend>Saved</legend><p>{saveMessage}</p></fieldset>}
      {(formError || saveError) && <fieldset className="projects-module__feedback projects-module__feedback--error"><legend>Validation</legend><p>{formError || saveError}</p></fieldset>}
      {joinError && <fieldset className="projects-module__feedback projects-module__feedback--error"><legend>Join Requests</legend><p>{joinError}</p></fieldset>}

      {isCreateOpen && canUseMemberFeatures && (
        <fieldset className="projects-module__form-wrapper">
          <legend>New Project</legend>
          <form className="projects-module__form" onSubmit={handleCreateSubmit}>
            <label className="projects-module__field">
              <span>Project Name *</span>
              <input value={formValues.name} onChange={(event) => handleFormFieldChange('name', event.target.value)} maxLength={100} required />
            </label>
            <label className="projects-module__field projects-module__field--full-width">
              <span>Description *</span>
              <textarea rows={4} value={formValues.description} onChange={(event) => handleFormFieldChange('description', event.target.value)} maxLength={4000} required />
            </label>
            <label className="projects-module__field">
              <span>Repository Link</span>
              <input type="url" value={formValues.repoUrl} onChange={(event) => handleFormFieldChange('repoUrl', event.target.value)} placeholder="https://github.com/org/repo" />
            </label>
            <label className="projects-module__field">
              <span>Demo URL</span>
              <input type="url" value={formValues.demoUrl} onChange={(event) => handleFormFieldChange('demoUrl', event.target.value)} placeholder="https://example.com" />
            </label>
            <label className="projects-module__field">
              <span>Tech Stack (comma-separated)</span>
              <input value={formValues.techStack} onChange={(event) => handleFormFieldChange('techStack', event.target.value)} placeholder="React, TypeScript, AWS" />
            </label>

            <div className="projects-module__field projects-module__field--full-width">
              <ResourceImagePicker
                file={imageFile}
                imageUrl={formValues.imageUrl}
                onFileChange={setImageFile}
                onImageUrlChange={(imageUrl) => handleFormFieldChange('imageUrl', imageUrl)}
              />
            </div>

            <label className="projects-module__field projects-module__field--full-width">
              <span>Invite Members (optional)</span>
              <input value={memberLookupQuery} onChange={handleMemberLookup} placeholder="Search by handle" />
              {isSearchingMembers && <p className="projects-module__lookup-hint">Searching members...</p>}
              {!isSearchingMembers && memberLookupQuery.trim() && lookupCandidates.length === 0 && <p className="projects-module__lookup-hint">No members found.</p>}
              {lookupCandidates.length > 0 && (
                <div className="projects-module__lookup-results" role="listbox" aria-label="Member lookup results">
                  {lookupCandidates.map((member) => (
                    <button key={member.id} type="button" className="projects-module__lookup-item" onClick={() => {
                      setInvitedMembers((current) => [...current, member]);
                      setMemberLookupQuery('');
                      setMemberLookupResults([]);
                    }}>
                      <span>{member.displayName}</span>
                      <span className="projects-module__lookup-username">@{member.handle}</span>
                    </button>
                  ))}
                </div>
              )}
              {invitedMembers.length > 0 && (
                <div className="projects-module__invite-list" aria-label="Invited members">
                  {invitedMembers.map((member) => (
                    <button key={member.id} type="button" className="projects-module__invite-pill" onClick={() => setInvitedMembers((current) => current.filter((candidate) => candidate.id !== member.id))} title="Remove invite">
                      {member.displayName} (@{member.handle}) ×
                    </button>
                  ))}
                </div>
              )}
            </label>

            <label className="projects-module__field projects-module__field--checkbox">
              <input type="checkbox" checked={formValues.submitForReview} onChange={(event) => handleFormFieldChange('submitForReview', event.target.checked)} />
              <span>Submit for officer review</span>
            </label>
            <div className="projects-module__actions">
              <button type="submit" className="projects-module__button" disabled={isSaving}>{isSaving ? 'Saving...' : 'Create Project'}</button>
            </div>
          </form>
        </fieldset>
      )}

      {isLoading && <fieldset className="projects-module__feedback"><legend>Loading</legend><p>Loading projects...</p></fieldset>}
      {!isLoading && error && <fieldset className="projects-module__feedback projects-module__feedback--error"><legend>Error</legend><p>{error}</p></fieldset>}
      {!isLoading && !error && projects.length === 0 && <fieldset className="projects-module__feedback"><legend>No Published Projects</legend><p>There are no public projects yet.</p></fieldset>}
      {!isLoading && !error && projects.length > 0 && (
        <div className="projects-module__list">
          {projects.map((project) => (
            <div key={project.id} className="projects-module__card-wrapper">
              <ProjectCard project={project} onRequestJoin={() => void handleRequestToJoin(project.id)} isRequestJoinDisabled={isRequestingJoin} />
              {joinMessageByProject[project.id] && <p className="projects-module__join-message">{joinMessageByProject[project.id]}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
