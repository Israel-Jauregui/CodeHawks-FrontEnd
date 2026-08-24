import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProfileModule from '../components/browser/modules/ProfileModule';
import type { MemberProfile } from '../types/clubData';

const authMocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  updateProfile: vi.fn(),
  deleteAccount: vi.fn(),
}));

vi.mock('../auth/AuthContext', () => ({
  useAuth: authMocks.useAuth,
}));

const privateMember: MemberProfile = {
  id: 'member-1',
  handle: 'private_member',
  displayName: 'Private Member',
  role: 'member',
  minors: [],
  techStack: ['TypeScript'],
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
  email: 'member@ung.edu',
  identityProvider: 'entra',
  identitySubject: 'subject-1',
  isPublicProfile: false,
  newsletterOptIn: false,
  status: 'active',
  lastSeenAt: '2026-08-01T00:00:00.000Z',
};

describe('member privacy controls', () => {
  beforeEach(() => {
    authMocks.updateProfile.mockResolvedValue(privateMember);
    authMocks.deleteAccount.mockRejectedValue(new Error('Deletion service unavailable.'));
    authMocks.useAuth.mockReturnValue({
      user: privateMember,
      isLoading: false,
      error: null,
      updateProfile: authMocks.updateProfile,
      uploadAvatar: vi.fn(),
      removeAvatar: vi.fn(),
      exportMyData: vi.fn(),
      deleteAccount: authMocks.deleteAccount,
    });
  });

  it('starts consent choices off, saves explicit opt-ins, and gates account deletion behind DELETE', async () => {
    const user = userEvent.setup();
    render(<ProfileModule />);

    await user.click(screen.getByRole('button', { name: 'Edit Profile & Privacy' }));

    const publicProfile = screen.getByRole('checkbox', { name: /Show my profile in the public Members directory/ });
    const newsletter = screen.getByRole('checkbox', { name: /Email me optional club-announcement newsletters/ });
    expect(publicProfile).not.toBeChecked();
    expect(newsletter).not.toBeChecked();

    await user.click(publicProfile);
    await user.click(newsletter);
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => expect(authMocks.updateProfile).toHaveBeenCalledWith(expect.objectContaining({
      isPublicProfile: true,
      newsletterOptIn: true,
    })));
    expect(await screen.findByText('Your profile and privacy choices were updated.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete My Account' }));
    const dialog = screen.getByRole('dialog', { name: 'Delete CodeHawks Account' });
    expect(dialog).toHaveTextContent(/does not delete your UNG Microsoft account/i);

    const permanentDelete = screen.getByRole('button', { name: 'Permanently Delete Account' });
    expect(permanentDelete).toBeDisabled();
    await user.type(screen.getByLabelText(/Type DELETE to confirm/i), 'DELETE');
    expect(permanentDelete).toBeEnabled();
    await user.click(permanentDelete);

    expect(authMocks.deleteAccount).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole('alert')).toHaveTextContent('Deletion service unavailable.');
  });
});
