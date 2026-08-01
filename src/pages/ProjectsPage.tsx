import { useState } from 'react';
import TopAppBar from '../components/TopAppBar';
import ProjectCard from '../components/ProjectCard';
import { useProjectsData } from '../hooks/useProjectsData';
import type { CreateProjectInput } from '../types/clubData';
import './ProjectsPage.css';

interface ProjectFormValues {
  projectName: string;
  projectDesc: string;
  repoLink: string;
  projectPicsUrl: string;
  memberUsernames: string;
}

const EMPTY_FORM_VALUES: ProjectFormValues = {
  projectName: '',
  projectDesc: '',
  repoLink: '',
  projectPicsUrl: '',
  memberUsernames: '',
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
    memberUsernames: formValues.memberUsernames
      .split(',')
      .map((username) => username.trim())
      .filter((username) => username.length > 0),
  };
}

export default function ProjectsPage() {
  const {
    projects,
    isLoading,
    error,
    reload,
    addProject,
    isSaving,
    saveError,
  } = useProjectsData();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formValues, setFormValues] = useState<ProjectFormValues>(EMPTY_FORM_VALUES);
  const [formError, setFormError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

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

    return null;
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

    const createPayload: CreateProjectInput = mapFormToCreateProjectInput(formValues);
    const createdProject = await addProject(createPayload);

    if (createdProject) {
      setSaveMessage(`Project "${createdProject.projectName}" was added successfully.`);
      setFormValues(EMPTY_FORM_VALUES);
      setIsCreateOpen(false);
    }
  };

  return (
    <div className="projects-page-root">
      <div className="window projects-page-window">
        <TopAppBar
          title="ADC Projects"
          showAuthButton={false}
        />

        <div className="window-body projects-page-body">
          <section className="projects-page-section">
            <h1 className="projects-page-title">Projects Workspace</h1>
            <p className="projects-page-subtitle">
              Browse active club builds and add new projects for local testing.
            </p>

            <div className="projects-page-toolbar">
              <button
                type="button"
                className="projects-page-add-button"
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
                className="projects-page-refresh-button"
                onClick={() => void reload()}
                disabled={isLoading}
              >
                Refresh
              </button>
            </div>

            {saveMessage && (
              <fieldset className="projects-page-feedback projects-page-feedback--success">
                <legend>Saved</legend>
                <p>{saveMessage}</p>
              </fieldset>
            )}

            {(formError || saveError) && (
              <fieldset className="projects-page-feedback projects-page-feedback--error">
                <legend>Validation</legend>
                <p>{formError || saveError}</p>
              </fieldset>
            )}

            {isCreateOpen && (
              <fieldset className="projects-create-form-wrapper">
                <legend>New Project</legend>
                <form className="projects-create-form" onSubmit={handleCreateSubmit}>
                  <label className="projects-create-form__field">
                    <span>Project Name *</span>
                    <input
                      type="text"
                      value={formValues.projectName}
                      onChange={(event) => handleFormFieldChange('projectName', event.target.value)}
                      maxLength={100}
                      required
                    />
                  </label>

                  <label className="projects-create-form__field">
                    <span>Description *</span>
                    <textarea
                      rows={4}
                      value={formValues.projectDesc}
                      onChange={(event) => handleFormFieldChange('projectDesc', event.target.value)}
                      required
                    />
                  </label>

                  <label className="projects-create-form__field">
                    <span>Repository Link</span>
                    <input
                      type="url"
                      value={formValues.repoLink}
                      onChange={(event) => handleFormFieldChange('repoLink', event.target.value)}
                      placeholder="https://github.com/org/repo"
                    />
                  </label>

                  <label className="projects-create-form__field">
                    <span>Image URL</span>
                    <input
                      type="url"
                      value={formValues.projectPicsUrl}
                      onChange={(event) => handleFormFieldChange('projectPicsUrl', event.target.value)}
                      placeholder="https://example.com/project.png"
                    />
                  </label>

                  <label className="projects-create-form__field">
                    <span>Member Usernames (comma separated)</span>
                    <input
                      type="text"
                      value={formValues.memberUsernames}
                      onChange={(event) => handleFormFieldChange('memberUsernames', event.target.value)}
                      placeholder="aidenf, mariac, joshk"
                    />
                  </label>

                  <div className="projects-create-form__actions">
                    <button type="submit" className="projects-create-form__submit" disabled={isSaving}>
                      {isSaving ? 'Saving...' : 'Save Project'}
                    </button>
                  </div>
                </form>
              </fieldset>
            )}

            {isLoading && (
              <fieldset className="projects-page-feedback">
                <legend>Loading</legend>
                <p>Loading projects...</p>
              </fieldset>
            )}

            {!isLoading && error && (
              <fieldset className="projects-page-feedback projects-page-feedback--error">
                <legend>Error</legend>
                <p>{error}</p>
              </fieldset>
            )}

            {!isLoading && !error && projects.length === 0 && (
              <fieldset className="projects-page-feedback projects-page-feedback--empty">
                <legend>No Projects Yet</legend>
                <p>Add your first project using the form above.</p>
              </fieldset>
            )}

            {!isLoading && !error && projects.length > 0 && (
              <div className="projects-page-list">
                {projects.map((project) => (
                  <ProjectCard key={project.projectId} project={project} />
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="status-bar projects-page-status-bar">
          <p className="status-bar-field">Projects</p>
          <p className="status-bar-field">Local data mode</p>
          <p className="status-bar-field">Ready</p>
        </div>
      </div>
    </div>
  );
}
