import { useMemo, useState } from 'react';
import ProjectCard from '../../ProjectCard';
import { useProjectsData } from '../../../hooks/useProjectsData';
import type { CreateProjectInput, MemberSummary } from '../../../types/clubData';
import { getUsernameFromJwt } from '../../../utils/jwt';
import './ProjectsModule.css';

interface ProjectFormValues {
  projectName: string;
  projectDesc: string;
  repoLink: string;
  projectPicsUrl: string;
}

const EMPTY_FORM_VALUES: ProjectFormValues = {
  projectName: '',
  projectDesc: '',
  repoLink: '',
  projectPicsUrl: '',
};

function isValidHttpUrl(value: string): boolean {
  if (!value.trim()) {
    return true;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function mapFormToCreateProjectInput(formValues: ProjectFormValues): CreateProjectInput {
  return {
    projectName: formValues.projectName.trim(),
    projectDesc: formValues.projectDesc.trim(),
    repoLink: formValues.repoLink.trim() || null,
    projectPicsUrl: formValues.projectPicsUrl.trim() || null,
    memberUsernames: [],
  };
}

export default function ProjectsModule() {
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
  const [formError, setFormError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [joinMessageByProject, setJoinMessageByProject] = useState<Record<number, string>>({});

  const handleFormFieldChange = (field: keyof ProjectFormValues, value: string) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
  };

  const validateForm = (): string | null => {
    if (!formValues.projectName.trim()) {
      return 'Project name is required.';
    }

    if (!formValues.projectDesc.trim()) {
      return 'Project description is required.';
    }

    if (!isValidHttpUrl(formValues.repoLink)) {
      return 'Repository link must be a valid http(s) URL.';
    }

    if (!isValidHttpUrl(formValues.projectPicsUrl)) {
      return 'Image URL must be a valid http(s) URL.';
    }

    if (invitedMembers.length === 0) {
      return 'Invite at least one member.';
    }

    return null;
  };

  const invitedUsernames = useMemo(
    () => invitedMembers.map((member) => member.username),
    [invitedMembers],
  );

  const lookupCandidates = useMemo(() => {
    const invitedSet = new Set(invitedMembers.map((member) => member.username));
    return memberLookupResults.filter((member) => !invitedSet.has(member.username));
  }, [invitedMembers, memberLookupResults]);

  const currentUsername = useMemo(() => {
    const token = window.localStorage.getItem('token');
    return token ? getUsernameFromJwt(token) : null;
  }, []);

  const handleMemberLookup: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const nextQuery = event.target.value;
    setMemberLookupQuery(nextQuery);

    if (!nextQuery.trim()) {
      setMemberLookupResults([]);
      return;
    }

    const results = await searchMembers(nextQuery);
    setMemberLookupResults(results);
  };

  const handleInviteMember = (member: MemberSummary) => {
    setInvitedMembers((currentMembers) => [...currentMembers, member]);
    setMemberLookupQuery('');
    setMemberLookupResults([]);
  };

  const handleRemoveInvitedMember = (username: string) => {
    setInvitedMembers((currentMembers) =>
      currentMembers.filter((member) => member.username !== username),
    );
  };

  const handleRequestToJoin = async (projectId: number) => {
    if (!currentUsername) {
      setJoinMessageByProject((currentMap) => ({
        ...currentMap,
        [projectId]: 'Log in first to request to join this project.',
      }));
      return;
    }

    const status = await requestToJoin(projectId, currentUsername);

    if (!status) {
      return;
    }

    const statusLabel =
      status === 'requested'
        ? 'Request submitted. The team has been notified.'
        : status === 'already-member'
          ? 'You are already a member of this project.'
          : 'You already requested to join this project.';

    setJoinMessageByProject((currentMap) => ({
      ...currentMap,
      [projectId]: statusLabel,
    }));
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

    const createPayload: CreateProjectInput = {
      ...mapFormToCreateProjectInput(formValues),
      memberUsernames: invitedUsernames,
    };
    const createdProject = await addProject(createPayload);

    if (createdProject) {
      setSaveMessage(`Project "${createdProject.projectName}" was added successfully.`);
      setFormValues(EMPTY_FORM_VALUES);
      setInvitedMembers([]);
      setMemberLookupQuery('');
      setMemberLookupResults([]);
      setIsCreateOpen(false);
    }
  };

  return (
    <section className="projects-module">
      <h2 className="projects-module__title">Projects Workspace</h2>
      <p className="projects-module__subtitle">
        Browse active club builds and add new projects without leaving the desktop shell.
      </p>

      <div className="projects-module__toolbar">
        <button
          type="button"
          className="projects-module__button"
          onClick={() => {
            setIsCreateOpen((isCurrentlyOpen) => !isCurrentlyOpen);
            setFormError(null);
            setSaveMessage(null);
          }}
        >
          {isCreateOpen ? 'Close Form' : 'Add Project'}
        </button>
        <button
          type="button"
          className="projects-module__button"
          onClick={() => void reload()}
          disabled={isLoading}
        >
          Refresh
        </button>
      </div>

      {saveMessage && (
        <fieldset className="projects-module__feedback projects-module__feedback--success">
          <legend>Saved</legend>
          <p>{saveMessage}</p>
        </fieldset>
      )}

      {(formError || saveError) && (
        <fieldset className="projects-module__feedback projects-module__feedback--error">
          <legend>Validation</legend>
          <p>{formError || saveError}</p>
        </fieldset>
      )}

      {joinError && (
        <fieldset className="projects-module__feedback projects-module__feedback--error">
          <legend>Join Requests</legend>
          <p>{joinError}</p>
        </fieldset>
      )}

      {isCreateOpen && (
        <fieldset className="projects-module__form-wrapper">
          <legend>New Project</legend>
          <form className="projects-module__form" onSubmit={handleCreateSubmit}>
            <label className="projects-module__field">
              <span>Project Name *</span>
              <input
                type="text"
                value={formValues.projectName}
                onChange={(event) => handleFormFieldChange('projectName', event.target.value)}
                maxLength={100}
                required
              />
            </label>

            <label className="projects-module__field">
              <span>Description *</span>
              <textarea
                rows={4}
                value={formValues.projectDesc}
                onChange={(event) => handleFormFieldChange('projectDesc', event.target.value)}
                required
              />
            </label>

            <label className="projects-module__field">
              <span>Repository Link</span>
              <input
                type="url"
                value={formValues.repoLink}
                onChange={(event) => handleFormFieldChange('repoLink', event.target.value)}
                placeholder="https://github.com/org/repo"
              />
            </label>

            <label className="projects-module__field">
              <span>Image URL</span>
              <input
                type="url"
                value={formValues.projectPicsUrl}
                onChange={(event) => handleFormFieldChange('projectPicsUrl', event.target.value)}
                placeholder="https://example.com/project.png"
              />
            </label>

            <label className="projects-module__field projects-module__field--full-width">
              <span>Invite Members *</span>
              <input
                type="text"
                value={memberLookupQuery}
                onChange={handleMemberLookup}
                placeholder="Search by username or full name"
              />

              {isSearchingMembers && (
                <p className="projects-module__lookup-hint">Searching members...</p>
              )}

              {!isSearchingMembers && memberLookupQuery.trim() && lookupCandidates.length === 0 && (
                <p className="projects-module__lookup-hint">No members found.</p>
              )}

              {lookupCandidates.length > 0 && (
                <div className="projects-module__lookup-results" role="listbox" aria-label="Member lookup results">
                  {lookupCandidates.map((member) => (
                    <button
                      key={member.username}
                      type="button"
                      className="projects-module__lookup-item"
                      onClick={() => handleInviteMember(member)}
                    >
                      <span>{member.fullname}</span>
                      <span className="projects-module__lookup-username">@{member.username}</span>
                    </button>
                  ))}
                </div>
              )}

              {invitedMembers.length > 0 && (
                <div className="projects-module__invite-list" aria-label="Invited members">
                  {invitedMembers.map((member) => (
                    <button
                      key={member.username}
                      type="button"
                      className="projects-module__invite-pill"
                      onClick={() => handleRemoveInvitedMember(member.username)}
                      title="Remove invite"
                    >
                      {member.fullname} (@{member.username}) x
                    </button>
                  ))}
                </div>
              )}
            </label>

            <div className="projects-module__actions">
              <button type="submit" className="projects-module__button" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Project'}
              </button>
            </div>
          </form>
        </fieldset>
      )}

      {isLoading && (
        <fieldset className="projects-module__feedback">
          <legend>Loading</legend>
          <p>Loading projects...</p>
        </fieldset>
      )}

      {!isLoading && error && (
        <fieldset className="projects-module__feedback projects-module__feedback--error">
          <legend>Error</legend>
          <p>{error}</p>
        </fieldset>
      )}

      {!isLoading && !error && projects.length === 0 && (
        <fieldset className="projects-module__feedback">
          <legend>No Projects Yet</legend>
          <p>Add your first project using the form above.</p>
        </fieldset>
      )}

      {!isLoading && !error && projects.length > 0 && (
        <div className="projects-module__list">
          {projects.map((project) => (
            <div key={project.projectId} className="projects-module__card-wrapper">
              <ProjectCard
                project={project}
                onRequestJoin={() => void handleRequestToJoin(project.projectId)}
                isRequestJoinDisabled={isRequestingJoin}
              />
              {joinMessageByProject[project.projectId] && (
                <p className="projects-module__join-message">{joinMessageByProject[project.projectId]}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
