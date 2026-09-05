import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { canManageResources } from '../auth/permissions';
import { apiRequest } from '../services/apiClient';
import { invalidatePublicResources } from '../services/apiClubDataProvider';
import { isUsingLocalData } from '../services/clubDataProvider';
import { loadManagedResources, readAll, resourcePath, type Invitation, type ManagedResource, type Membership } from '../services/resourceManagement';
import type { ResourceType } from '../types/clubData';
import './ResourceWorkspace.css';

interface Props {
  type: ResourceType;
  selectedId?: string;
  created?: ManagedResource;
  onChanged: () => Promise<void>;
}

export default function ResourceWorkspace(props: Props) {
  const { user } = useAuth();
  if (isUsingLocalData || !user || user.status !== 'active') return null;
  // Changing accounts unmounts all private state and pending request handlers.
  return <MemberWorkspace key={`${user.id}:${user.role}:${props.type}`} {...props} officer={canManageResources(user.role)} />;
}

function MemberWorkspace({ type, selectedId, created, onChanged, officer }: Props & { officer: boolean }) {
  const [resources, setResources] = useState<ManagedResource[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(null);
    void Promise.all([loadManagedResources(type, officer), readAll<Invitation>('/v1/me/invitations')])
      .then(([managed, invites]) => {
        if (!current) return;
        setResources(managed);
        setInvitations(invites.filter((invitation) => invitation.resourceType === type));
      })
      .catch((reason: unknown) => { if (current) setError(reason instanceof Error ? reason.message : 'Unable to load member tools.'); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [type, officer, revision]);

  const changed = useCallback(async () => {
    invalidatePublicResources();
    await onChanged();
    window.dispatchEvent(new Event('club-membership-changed'));
  }, [onChanged]);

  const respond = async (invitation: Invitation, response: 'accepted' | 'declined') => {
    setBusy(true); setError(null); setMessage(null);
    try {
      await apiRequest(`${resourcePath(type, invitation.resourceId)}/invitation`, { method: 'PATCH', auth: true, body: { response } });
      setInvitations((current) => current.filter((item) => item.resourceId !== invitation.resourceId));
      setMessage(`Invitation to ${invitation.resourceName} ${response}.`);
      await changed();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to respond to the invitation.');
    } finally { setBusy(false); }
  };

  // A just-created draft remains visible even before the membership index catches up.
  const visibleResources = created && !resources.some((resource) => resource.id === created.id)
    ? [created, ...resources] : resources;

  return <section className="resource-workspace" aria-label={`${type} member tools`}>
    <h3>{officer ? 'Officer & Member Tools' : `My ${type === 'project' ? 'Projects' : 'Teams'}`}</h3>
    <button type="button" disabled={loading || busy} onClick={() => setRevision((value) => value + 1)}>Refresh Member Tools</button>
    {loading && <p role="status">Loading member tools...</p>}
    {error && <p role="alert">{error}</p>}
    {message && <p role="status">{message}</p>}
    {invitations.map((invitation) => <fieldset key={invitation.resourceId} className={selectedId === invitation.resourceId ? 'resource-workspace__selected' : ''}>
      <legend>Invitation: {invitation.resourceName}</legend>
      <p>Invited by {invitation.invitedByHandle}</p>
      <div className="resource-workspace__actions">
        <button type="button" disabled={busy} onClick={() => void respond(invitation, 'accepted')}>Accept Invitation</button>
        <button type="button" disabled={busy} onClick={() => void respond(invitation, 'declined')}>Decline Invitation</button>
      </div>
    </fieldset>)}
    {!loading && !error && visibleResources.length === 0 && invitations.length === 0 && <p>No owned {type === 'project' ? 'projects' : 'teams'} or invitations yet.</p>}
    {visibleResources.map((resource) => <ResourceManager key={resource.id} resource={resource} type={type} officer={officer} selected={selectedId === resource.id} onChanged={changed} />)}
  </section>;
}

function ResourceManager({ resource, type, officer, selected, onChanged }: {
  resource: ManagedResource; type: ResourceType; officer: boolean; selected: boolean; onChanged: () => Promise<void>;
}) {
  const [current, setCurrent] = useState(resource);
  const [expanded, setExpanded] = useState(selected);
  const [requests, setRequests] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => { setCurrent(resource); }, [resource]);
  useEffect(() => { if (selected) setExpanded(true); }, [selected]);
  useEffect(() => {
    if (!expanded) return;
    let active = true;
    setLoading(true); setError(null);
    void readAll<Membership>(`${resourcePath(type, resource.id)}/memberships?status=requested`)
      .then((items) => { if (active) setRequests(items); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Unable to load join requests.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [expanded, type, resource.id, revision]);

  const act = async (path: string, body: unknown, success: string, memberId?: string) => {
    setBusy(true); setError(null); setMessage(null);
    try {
      const updated = await apiRequest<ManagedResource>(path, { method: 'PATCH', auth: true, body });
      setCurrent(updated);
      if (memberId) setRequests((items) => items.filter((item) => item.memberId !== memberId));
      setMessage(success);
      await onChanged();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save changes.'); }
    finally { setBusy(false); }
  };

  return <fieldset className={selected ? 'resource-workspace__selected' : ''}>
    <legend>{current.name} — {current.status.replaceAll('_', ' ')}</legend>
    <p>{current.description}</p>
    <div className="resource-workspace__actions">
      {type === 'project' && current.status === 'draft' && !officer && <button type="button" disabled={busy} onClick={() => void act(resourcePath(type, current.id), { status: 'pending_review' }, 'Submitted for officer review.')}>Submit for Review</button>}
      {type === 'project' && officer && (current.status === 'pending_review' || current.status === 'draft') && <button type="button" disabled={busy} onClick={() => void act(resourcePath(type, current.id), { status: 'published' }, 'Project published.')}>Publish Project</button>}
      {type === 'project' && officer && current.status === 'pending_review' && <button type="button" disabled={busy} onClick={() => void act(resourcePath(type, current.id), { status: 'draft' }, 'Returned to draft.')}>Return to Draft</button>}
      <button type="button" aria-expanded={expanded} disabled={busy} onClick={() => setExpanded((value) => !value)}>{expanded ? 'Hide Join Requests' : 'Review Join Requests'}</button>
    </div>
    {message && <p role="status">{message}</p>}
    {error && <p role="alert">{error}</p>}
    {expanded && <div>
      <button type="button" disabled={busy || loading} onClick={() => setRevision((value) => value + 1)}>Refresh Join Requests</button>
      {loading && <p role="status">Loading join requests...</p>}
      {!loading && requests.length === 0 && <p>No pending join requests.</p>}
      {requests.map((request) => <div className="resource-workspace__request" key={request.memberId}>
        <span>{request.memberHandle}</span>
        <button type="button" disabled={busy || current.status === 'archived'} onClick={() => void act(`${resourcePath(type, current.id)}/join-requests/${encodeURIComponent(request.memberId)}`, { status: 'active' }, `${request.memberHandle} approved.`, request.memberId)}>Approve {request.memberHandle}</button>
        <button type="button" disabled={busy} onClick={() => void act(`${resourcePath(type, current.id)}/join-requests/${encodeURIComponent(request.memberId)}`, { status: 'rejected' }, `${request.memberHandle} declined.`, request.memberId)}>Decline {request.memberHandle}</button>
      </div>)}
    </div>}
  </fieldset>;
}
