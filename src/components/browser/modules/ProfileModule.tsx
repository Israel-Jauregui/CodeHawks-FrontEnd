import { useEffect, useState } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import type { MemberProfilePatch } from '../../../types/clubData';
import './ProfileModule.css';

interface ProfileForm {
  displayName: string;
  bio: string;
  major: string;
  minors: string;
  techStack: string;
  githubUrl: string;
  linkedinUrl: string;
}

const EMPTY_FORM: ProfileForm = {
  displayName: '',
  bio: '',
  major: '',
  minors: '',
  techStack: '',
  githubUrl: '',
  linkedinUrl: '',
};

function createForm(user: ReturnType<typeof useAuth>['user']): ProfileForm {
  if (!user) return EMPTY_FORM;
  return {
    displayName: user.displayName,
    bio: user.bio ?? '',
    major: user.major ?? '',
    minors: user.minors.join(', '),
    techStack: user.techStack.join(', '),
    githubUrl: user.githubUrl ?? '',
    linkedinUrl: user.linkedinUrl ?? '',
  };
}

function listFrom(value: string, maxItems: number): string[] {
  return value.split(',').map((item) => item.trim()).filter(Boolean).slice(0, maxItems);
}

function isHttpsOrEmpty(value: string): boolean {
  if (!value.trim()) return true;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

export default function ProfileModule() {
  const { user, isLoading, error: authError, updateProfile, uploadAvatar } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<ProfileForm>(() => createForm(user));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setForm(createForm(user)), [user]);

  if (isLoading) return <section className="profile-module"><fieldset><legend>Loading</legend><p>Loading your CodeHawks profile...</p></fieldset></section>;
  if (!user) return <section className="profile-module"><fieldset><legend>Sign In Required</legend><p>{authError ?? 'Sign in to view your member profile.'}</p></fieldset></section>;

  const saveProfile: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    if (!form.displayName.trim()) {
      setError('Display name is required.');
      return;
    }
    if (!isHttpsOrEmpty(form.githubUrl) || !isHttpsOrEmpty(form.linkedinUrl)) {
      setError('GitHub and LinkedIn links must use HTTPS.');
      return;
    }

    const patch: MemberProfilePatch = {
      displayName: form.displayName.trim(),
      bio: form.bio.trim() || null,
      major: form.major.trim() || null,
      minors: listFrom(form.minors, 4),
      techStack: listFrom(form.techStack, 25),
      githubUrl: form.githubUrl.trim() || null,
      linkedinUrl: form.linkedinUrl.trim() || null,
    };

    setIsSaving(true);
    setError(null);
    setMessage(null);
    try {
      await updateProfile(patch);
      setMessage('Your profile was updated.');
      setIsEditing(false);
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : 'Unable to update your profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatar: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Choose a JPEG, PNG, or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Avatar images must be 5 MiB or smaller.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setMessage(null);
    try {
      await uploadAvatar(file);
      setMessage('Your avatar was uploaded.');
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : 'Unable to upload your avatar.');
    } finally {
      setIsSaving(false);
      event.target.value = '';
    }
  };

  return (
    <section className="profile-module">
      <div className="profile-module__heading">
        <div className="profile-module__avatar" aria-label={`${user.displayName}'s avatar`}>
          {user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : user.displayName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2>{user.displayName}</h2>
          <p>@{user.handle} · {user.role.replaceAll('_', ' ')}</p>
        </div>
        <button type="button" onClick={() => { setIsEditing((editing) => !editing); setError(null); setMessage(null); }}>
          {isEditing ? 'Cancel Edit' : 'Edit Profile'}
        </button>
      </div>

      {message && <fieldset className="profile-module__message profile-module__message--success"><legend>Success</legend><p>{message}</p></fieldset>}
      {error && <fieldset className="profile-module__message profile-module__message--error"><legend>Error</legend><p>{error}</p></fieldset>}

      {isEditing ? (
        <form onSubmit={saveProfile}>
          <fieldset className="profile-module__form">
            <legend>Member Details</legend>
            <label><span>Display Name *</span><input value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} maxLength={100} required /></label>
            <label><span>Major</span><input value={form.major} onChange={(event) => setForm((current) => ({ ...current, major: event.target.value }))} maxLength={120} /></label>
            <label className="profile-module__full"><span>Bio</span><textarea rows={4} value={form.bio} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} maxLength={800} /></label>
            <label><span>Minors (comma-separated)</span><input value={form.minors} onChange={(event) => setForm((current) => ({ ...current, minors: event.target.value }))} /></label>
            <label><span>Tech Stack (comma-separated)</span><input value={form.techStack} onChange={(event) => setForm((current) => ({ ...current, techStack: event.target.value }))} /></label>
            <label><span>GitHub URL</span><input type="url" value={form.githubUrl} onChange={(event) => setForm((current) => ({ ...current, githubUrl: event.target.value }))} /></label>
            <label><span>LinkedIn URL</span><input type="url" value={form.linkedinUrl} onChange={(event) => setForm((current) => ({ ...current, linkedinUrl: event.target.value }))} /></label>
            <div className="profile-module__actions"><button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</button></div>
          </fieldset>
        </form>
      ) : (
        <fieldset className="profile-module__details">
          <legend>Member Profile</legend>
          <dl>
            <div><dt>Email</dt><dd>{user.email}</dd></div>
            <div><dt>Major</dt><dd>{user.major || 'Not added'}</dd></div>
            <div><dt>Minors</dt><dd>{user.minors.join(', ') || 'None listed'}</dd></div>
            <div><dt>Bio</dt><dd>{user.bio || 'No bio yet.'}</dd></div>
            <div><dt>Tech Stack</dt><dd>{user.techStack.join(', ') || 'No technologies listed yet.'}</dd></div>
            <div><dt>GitHub</dt><dd>{user.githubUrl ? <a href={user.githubUrl} target="_blank" rel="noopener noreferrer">Open profile</a> : 'Not linked'}</dd></div>
            <div><dt>LinkedIn</dt><dd>{user.linkedinUrl ? <a href={user.linkedinUrl} target="_blank" rel="noopener noreferrer">Open profile</a> : 'Not linked'}</dd></div>
          </dl>
        </fieldset>
      )}

      <fieldset className="profile-module__avatar-upload">
        <legend>Profile Picture</legend>
        <p>JPEG, PNG, or WebP; maximum 5 MiB. The browser uploads directly to secure storage.</p>
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatar} disabled={isSaving} />
      </fieldset>
    </section>
  );
}
