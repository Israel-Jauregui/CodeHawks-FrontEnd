import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ResourceWorkspace from '../components/ResourceWorkspace';
import type { ManagedResource } from '../services/resourceManagement';

const mocks = vi.hoisted(() => ({ auth: vi.fn(), request: vi.fn(), page: vi.fn() }));
vi.mock('../auth/AuthContext', () => ({ useAuth: mocks.auth }));
vi.mock('../services/clubDataProvider', () => ({ isUsingLocalData: false }));
vi.mock('../services/apiClient', () => ({ apiRequest: mocks.request, apiRequestPage: mocks.page }));

const project: ManagedResource = { id: 'project-1', ownerId: 'owner', name: 'Club Robot', description: 'Build a robot', status: 'pending_review', techStack: [], createdAt: '', updatedAt: '' };
const changed = vi.fn().mockResolvedValue(undefined);

describe('resource workflows', () => {
  beforeEach(() => {
    mocks.auth.mockReturnValue({ user: { id: 'officer', role: 'president', status: 'active' } });
    mocks.request.mockReset(); mocks.page.mockReset();
    mocks.page.mockImplementation(async (path: string) => ({ data: path.includes('/manage/projects') ? [project] : [], meta: { nextCursor: null } }));
  });

  it('lets officers publish a submitted project and refreshes public data', async () => {
    mocks.request.mockResolvedValue({ ...project, status: 'published' });
    render(<ResourceWorkspace type="project" onChanged={changed} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Publish Project' }));
    expect(mocks.request).toHaveBeenCalledWith('/v1/projects/project-1', expect.objectContaining({ method: 'PATCH', auth: true, body: { status: 'published' } }));
    expect(await screen.findByText('Project published.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Publish Project' })).not.toBeInTheDocument();
    await waitFor(() => expect(changed).toHaveBeenCalled());
  });

  it('keeps a new owner draft visible and allows submission without officer publication controls', async () => {
    mocks.auth.mockReturnValue({ user: { id: 'owner', role: 'member', status: 'active' } });
    mocks.request.mockResolvedValue(project);
    render(<ResourceWorkspace type="project" created={{ ...project, status: 'draft' }} onChanged={changed} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Submit for Review' }));
    expect(mocks.request).toHaveBeenCalledWith('/v1/projects/project-1', expect.objectContaining({ body: { status: 'pending_review' } }));
    expect(screen.queryByRole('button', { name: 'Publish Project' })).not.toBeInTheDocument();
    expect(await screen.findByText('Submitted for officer review.')).toBeInTheDocument();
  });

  it.each(['accepted', 'declined'] as const)('allows a member to respond %s to an invitation on a later page', async (response) => {
    mocks.auth.mockReturnValue({ user: { id: 'member', role: 'member', status: 'active' } });
    mocks.page.mockImplementation(async (path: string) => ({
      data: path.includes('cursor=second') ? [{ resourceType: 'team', resourceId: 'team-1', resourceName: 'CTF Crew', invitedByHandle: 'captain' }] : [],
      meta: { nextCursor: path.includes('/invitations') && !path.includes('cursor=') ? 'second' : null },
    }));
    mocks.request.mockResolvedValue({});
    render(<ResourceWorkspace type="team" selectedId="team-1" onChanged={changed} />);
    await userEvent.click(await screen.findByRole('button', { name: response === 'accepted' ? 'Accept Invitation' : 'Decline Invitation' }));
    expect(mocks.request).toHaveBeenCalledWith('/v1/teams/team-1/invitation', expect.objectContaining({ body: { response } }));
    expect(await screen.findByText(`Invitation to CTF Crew ${response}.`)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Accept Invitation' })).not.toBeInTheDocument();
  });

  it.each(['active', 'rejected'] as const)('lets an owner review a join request as %s', async (status) => {
    mocks.auth.mockReturnValue({ user: { id: 'owner', role: 'member', status: 'active' } });
    mocks.page.mockImplementation(async (path: string) => ({
      data: path.startsWith('/v1/me/memberships') ? [{ resourceId: project.id, role: 'owner' }] : path.includes('/memberships?') ? [{ memberId: 'student', memberHandle: 'ada' }] : [],
      meta: { nextCursor: null },
    }));
    mocks.request.mockResolvedValue(project);
    render(<ResourceWorkspace type="project" selectedId="project-1" onChanged={changed} />);
    await userEvent.click(await screen.findByRole('button', { name: status === 'active' ? 'Approve ada' : 'Decline ada' }));
    expect(mocks.request).toHaveBeenCalledWith('/v1/projects/project-1/join-requests/student', expect.objectContaining({ body: { status } }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Approve ada' })).not.toBeInTheDocument());
  });

  it('keeps failed publication actionable and shows the API error', async () => {
    mocks.request.mockRejectedValue(new Error('Permission changed. Refresh your account.'));
    render(<ResourceWorkspace type="project" onChanged={changed} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Publish Project' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Permission changed');
    expect(screen.getByRole('button', { name: 'Publish Project' })).toBeEnabled();
  });
});
