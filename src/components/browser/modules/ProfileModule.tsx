import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { SITE_IDENTITY } from '../../../constants/site';
import type { MemberProfilePatch } from '../../../types/clubData';
import './ProfileModule.css';

interface ProfileForm {
  handle: string;
  displayName: string;
  bio: string;
  major: string;
  minors: string;
  techStack: string;
  githubUrl: string;
  linkedinUrl: string;
  isPublicProfile: boolean;
  newsletterOptIn: boolean;
}

const EMPTY_FORM: ProfileForm = {
  handle: '', displayName: '', bio: '', major: '', minors: '', techStack: '',
  githubUrl: '', linkedinUrl: '', isPublicProfile: false, newsletterOptIn: false,
};

const HANDLE_PATTERN = /^[a-z0-9](?:[a-z0-9_-]{1,38}[a-z0-9])$/;

function createForm(user: ReturnType<typeof useAuth>['user']): ProfileForm {
  if (!user) return EMPTY_FORM;
  return {
    handle: user.handle,
    displayName: user.displayName,
    bio: user.bio ?? '',
    major: user.major ?? '',
    minors: user.minors.join(', '),
    techStack: user.techStack.join(', '),
    githubUrl: user.githubUrl ?? '',
    linkedinUrl: user.linkedinUrl ?? '',
    isPublicProfile: user.isPublicProfile,
    newsletterOptIn: user.newsletterOptIn,
  };
}

function listFrom(value: string, maxItems: number): string[] {
  return value.split(',').map((item) => item.trim()).filter(Boolean).slice(0, maxItems);
}

function isAllowedProfileUrl(value: string, provider: 'github' | 'linkedin'): boolean {
  if (!value.trim()) return true;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return false;
    const hostname = url.hostname.toLowerCase();
    return provider === 'github'
      ? hostname === 'github.com' || hostname === 'www.github.com'
      : hostname === 'linkedin.com' || hostname.endsWith('.linkedin.com');
  } catch { return false; }
}

interface AccountDeletionDialogProps {
  open: boolean;
  isDeleting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

function AccountDeletionDialog({ open, isDeleting, error, onCancel, onConfirm }: AccountDeletionDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [confirmation, setConfirmation] = useState('');

  /* Native modal dialogs contain keyboard focus and restore it to the opener. */
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="profile-delete-dialog window"
      aria-labelledby="delete-account-title"
      aria-describedby="delete-account-description"
      onCancel={(event) => { event.preventDefault(); if (!isDeleting) onCancel(); }}
      onClose={() => { if (!isDeleting) onCancel(); }}
    >
      <div className="title-bar">
        <div className="title-bar-text" id="delete-account-title">Delete CodeHawks Account</div>
        <div className="title-bar-controls"><button type="button" aria-label="Close" onClick={onCancel} disabled={isDeleting}></button></div>
      </div>
      <div className="window-body profile-delete-dialog__body">
        <p id="delete-account-description">
          This removes your current profile, identity lookups, indexed recipient-side activity, live participation
          links, and all avatar objects attributable to your account. It anonymizes live shared references where
          applicable. Historical authored snapshots, newsletters and delivery records, audits, legacy non-indexed
          activity, owned club content, and project, team, or event media may remain pending officer review. It does
          not delete your UNG Microsoft account. This action cannot be undone.
        </p>
        <label htmlFor="delete-account-confirmation">Type <strong>DELETE</strong> to confirm</label>
        <input id="delete-account-confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" autoFocus disabled={isDeleting} />
        {error && <p className="profile-module__inline-error" role="alert">{error}</p>}
        <div className="profile-delete-dialog__actions">
          <button type="button" onClick={onCancel} disabled={isDeleting}>Cancel</button>
          <button type="button" className="profile-module__danger-button" onClick={onConfirm} disabled={isDeleting || confirmation !== 'DELETE'}>
            {isDeleting ? 'Deleting...' : 'Permanently Delete Account'}
          </button>
        </div>
      </div>
    </dialog>
  );
}

export default function ProfileModule() {
  const { user, isLoading, error: authError, updateProfile, uploadAvatar, removeAvatar, exportMyData, deleteAccount } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileForm>(() => createForm(user));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setForm(createForm(user)), [user]);

  if (isLoading) return <section className="profile-module"><fieldset><legend>Loading</legend><p role="status">Loading your CodeHawks profile...</p></fieldset></section>;
  if (!user) return <section className="profile-module"><fieldset><legend>Sign In Required</legend><p>{authError ?? 'Sign in to view your member profile.'}</p></fieldset></section>;

  const saveProfile: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    const normalizedHandle = form.handle.trim().toLowerCase();
    if (!HANDLE_PATTERN.test(normalizedHandle)) {
      setError('Handle must be 3–40 lowercase letters, numbers, underscores, or hyphens, and must start and end with a letter or number.');
      return;
    }
    if (!form.displayName.trim()) { setError('Display name is required.'); return; }
    if (!isAllowedProfileUrl(form.githubUrl, 'github') || !isAllowedProfileUrl(form.linkedinUrl, 'linkedin')) {
      setError('GitHub and LinkedIn links must use HTTPS on the corresponding provider domain.'); return;
    }

    const patch: MemberProfilePatch = {
      handle: normalizedHandle,
      displayName: form.displayName.trim(),
      bio: form.bio.trim() || null,
      major: form.major.trim() || null,
      minors: listFrom(form.minors, 4),
      techStack: listFrom(form.techStack, 25),
      githubUrl: form.githubUrl.trim() || null,
      linkedinUrl: form.linkedinUrl.trim() || null,
      isPublicProfile: form.isPublicProfile,
      newsletterOptIn: form.newsletterOptIn,
    };

    setIsSaving(true); setError(null); setMessage(null);
    try {
      await updateProfile(patch);
      setMessage('Your profile and privacy choices were updated.');
      setIsEditing(false);
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : 'Unable to update your profile.');
    } finally { setIsSaving(false); }
  };

  const handleAvatar: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setError('Choose a JPEG, PNG, or WebP image.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Avatar images must be 5 MiB or smaller.'); return; }
    setIsSaving(true); setError(null); setMessage(null);
    try {
      await uploadAvatar(file);
      setMessage('Your avatar was uploaded. The browser attempted to remove embedded image metadata before upload.');
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : 'Unable to upload your avatar.');
    } finally { setIsSaving(false); event.target.value = ''; }
  };

  const handleRemoveAvatar = async () => {
    setIsSaving(true); setError(null); setMessage(null);
    try {
      await removeAvatar();
      setMessage('Your profile picture and its current public media object were removed.');
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : 'Unable to remove your avatar.');
    } finally { setIsSaving(false); }
  };

  const handleExport = async () => {
    setIsExporting(true); setError(null); setMessage(null);
    try {
      const exportData = await exportMyData();
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = `codehawks-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.append(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(downloadUrl);
      setMessage('Your CodeHawks data export was downloaded. Review the limitations field for data that is not included.');
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : 'Unable to export your account data.');
    } finally { setIsExporting(false); }
  };

  const handleDelete = async () => {
    setIsDeleting(true); setDeleteError(null);
    try {
      await deleteAccount();
    } catch (unknownError) {
      setDeleteError(unknownError instanceof Error ? unknownError.message : 'Unable to delete your account.');
      setIsDeleting(false);
      return;
    }
    window.location.assign('/');
  };

  return (
    <section className="profile-module">
      <div className="profile-module__heading">
        <div className="profile-module__avatar" aria-label={`${user.displayName}'s avatar`}>
          {user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : user.displayName.charAt(0).toUpperCase()}
        </div>
        <div><h2>{user.displayName}</h2><p>@{user.handle} · {user.role.replaceAll('_', ' ')}</p></div>
        <button type="button" onClick={() => {
          setIsEditing((editing) => !editing); setForm(createForm(user)); setError(null); setMessage(null);
        }}>{isEditing ? 'Cancel Edit' : 'Edit Profile & Privacy'}</button>
      </div>

      {message && <fieldset className="profile-module__message profile-module__message--success" role="status" aria-live="polite"><legend>Success</legend><p>{message}</p></fieldset>}
      {error && <fieldset className="profile-module__message profile-module__message--error" role="alert"><legend>Error</legend><p>{error}</p></fieldset>}

      {isEditing ? (
        <form onSubmit={saveProfile} noValidate>
          <fieldset className="profile-module__form">
            <legend>Member Details</legend>
            <label><span>Public Handle *</span><input value={form.handle} onChange={(event) => setForm((current) => ({ ...current, handle: event.target.value.toLowerCase() }))} minLength={3} maxLength={40} pattern="[a-z0-9](?:[a-z0-9_-]{1,38}[a-z0-9])" required aria-describedby="handle-help" /></label>
            <p id="handle-help" className="profile-module__field-help">Used for member invitations; shown to visitors only if you enable your public profile. Lowercase letters, numbers, _ and -.</p>
            <label><span>Display Name *</span><input value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} maxLength={100} required /></label>
            <label><span>Major</span><input value={form.major} onChange={(event) => setForm((current) => ({ ...current, major: event.target.value }))} maxLength={120} /></label>
            <label className="profile-module__full"><span>Bio</span><textarea rows={4} value={form.bio} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} maxLength={800} /></label>
            <label><span>Academic Minors (comma-separated)</span><input value={form.minors} onChange={(event) => setForm((current) => ({ ...current, minors: event.target.value }))} /></label>
            <label><span>Tech Stack (comma-separated)</span><input value={form.techStack} onChange={(event) => setForm((current) => ({ ...current, techStack: event.target.value }))} /></label>
            <label><span>GitHub URL</span><input type="url" value={form.githubUrl} onChange={(event) => setForm((current) => ({ ...current, githubUrl: event.target.value }))} /></label>
            <label><span>LinkedIn URL</span><input type="url" value={form.linkedinUrl} onChange={(event) => setForm((current) => ({ ...current, linkedinUrl: event.target.value }))} /></label>

            <fieldset className="profile-module__preferences profile-module__full">
              <legend>Privacy and Communications</legend>
              <div className="profile-module__checkbox-row">
                <input id="public-profile-choice" type="checkbox" checked={form.isPublicProfile} onChange={(event) => setForm((current) => ({ ...current, isPublicProfile: event.target.checked }))} />
                <label className="profile-module__checkbox-label" htmlFor="public-profile-choice"><strong>Show my profile in the public Members directory</strong><span>Publishes your handle, name, optional profile fields, avatar, and links. Turning this off hides the directory card but does not delete an avatar or revoke a direct image URL someone already saved; use “Remove Current Profile Picture” below when needed. Your email and account activity remain private.</span></label>
              </div>
              <div className="profile-module__checkbox-row">
                <input id="newsletter-choice" type="checkbox" checked={form.newsletterOptIn} onChange={(event) => setForm((current) => ({ ...current, newsletterOptIn: event.target.checked }))} />
                <label className="profile-module__checkbox-label" htmlFor="newsletter-choice"><strong>Email me optional club-announcement newsletters</strong><span>You can turn these announcements off here at any time.</span></label>
              </div>
              <p>Read the <a href="/privacy">Privacy Policy</a> for complete data and retention details.</p>
            </fieldset>
            <div className="profile-module__actions"><button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</button></div>
          </fieldset>
        </form>
      ) : (
        <>
          <fieldset className="profile-module__details"><legend>Member Profile</legend><dl>
            <div><dt>Email</dt><dd>{user.email}</dd></div><div><dt>Major</dt><dd>{user.major || 'Not added'}</dd></div>
            <div><dt>Academic Minors</dt><dd>{user.minors.join(', ') || 'None listed'}</dd></div><div><dt>Bio</dt><dd>{user.bio || 'No bio yet.'}</dd></div>
            <div><dt>Tech Stack</dt><dd>{user.techStack.join(', ') || 'No technologies listed yet.'}</dd></div>
            <div><dt>GitHub</dt><dd>{user.githubUrl ? <a href={user.githubUrl} target="_blank" rel="noopener noreferrer">Open profile</a> : 'Not linked'}</dd></div>
            <div><dt>LinkedIn</dt><dd>{user.linkedinUrl ? <a href={user.linkedinUrl} target="_blank" rel="noopener noreferrer">Open profile</a> : 'Not linked'}</dd></div>
          </dl></fieldset>
          <fieldset className="profile-module__details"><legend>Privacy and Communications</legend><dl>
            <div><dt>Public Profile</dt><dd>{user.isPublicProfile ? 'On — your chosen profile fields appear publicly.' : 'Off — your profile is not in the public directory.'}</dd></div>
            <div><dt>Newsletters</dt><dd>{user.newsletterOptIn ? 'On — optional club announcements enabled.' : 'Off — optional club announcements disabled.'}</dd></div>
          </dl></fieldset>
        </>
      )}

      <fieldset className="profile-module__avatar-upload"><legend>Profile Picture</legend>
        <p>JPEG, PNG, or WebP; maximum 5 MiB. The browser attempts to re-encode the image and remove embedded metadata before uploading to quarantined CodeHawks storage. The server validates and finalizes supported images, but it does not guarantee metadata removal.</p>
        <label htmlFor="profile-avatar-file">Choose a profile picture</label>
        <input id="profile-avatar-file" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatar} disabled={isSaving} />
        {user.avatarUrl && <button type="button" onClick={() => void handleRemoveAvatar()} disabled={isSaving}>Remove Current Profile Picture</button>}
      </fieldset>

      <fieldset className="profile-module__data-controls"><legend>Your Data</legend>
        <p>Download the indexed JSON export or run the self-service deletion described in the Privacy Policy.</p>
        <div className="profile-module__data-actions">
          <button type="button" onClick={() => void handleExport()} disabled={isExporting || isDeleting}>{isExporting ? 'Preparing Export...' : 'Download My Data'}</button>
          <button type="button" className="profile-module__danger-button" onClick={() => { setDeleteError(null); setIsDeleteOpen(true); }} disabled={isDeleting}>Delete My Account</button>
        </div>
        <p className="profile-module__contact-note">Need help with a privacy request? Email <a href={`mailto:${SITE_IDENTITY.privacyEmail}`}>{SITE_IDENTITY.privacyEmail}</a>.</p>
      </fieldset>

      {isDeleteOpen && <AccountDeletionDialog open isDeleting={isDeleting} error={deleteError} onCancel={() => setIsDeleteOpen(false)} onConfirm={() => void handleDelete()} />}
    </section>
  );
}
