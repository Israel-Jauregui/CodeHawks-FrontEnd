import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnavailableAuthProvider } from '../auth/AuthContext';
import MembersDirectory from '../components/MembersDirectory';
import App from '../App';

const directoryMocks = vi.hoisted(() => ({
  getPublicDirectoryMembers: vi.fn(),
}));

vi.mock('../services/publicDirectory', () => ({
  getPublicDirectoryMembers: directoryMocks.getPublicDirectoryMembers,
}));

describe('public member directory', () => {
  beforeEach(() => {
    directoryMocks.getPublicDirectoryMembers.mockResolvedValue([
      {
        handle: 'alice',
        displayName: 'Alice Safe',
        major: 'Computer Science',
        techStack: ['React'],
        githubUrl: 'https://github.com/alice',
        linkedinUrl: 'https://linkedin.com.attacker.example/alice',
      },
      {
        handle: 'mallory',
        displayName: 'Mallory Example',
        major: 'Cybersecurity',
        techStack: ['Python'],
        githubUrl: 'https://github.com@attacker.example/mallory',
        linkedinUrl: 'javascript:alert(1)',
      },
    ]);
  });

  it('shows the returned public cards, filters them by search, and suppresses unsafe profile links', async () => {
    const user = userEvent.setup();
    render(<MembersDirectory />);

    expect(await screen.findByText('Alice Safe')).toBeInTheDocument();
    expect(screen.getByText('Mallory Example')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/alice');
    expect(screen.queryByRole('link', { name: 'LinkedIn' })).not.toBeInTheDocument();
    expect(document.querySelector('a[href*="attacker.example"]')).not.toBeInTheDocument();

    await user.type(screen.getByRole('searchbox', { name: 'Search public members' }), 'Python');

    await waitFor(() => {
      expect(screen.queryByText('Alice Safe')).not.toBeInTheDocument();
      expect(screen.getByText('Mallory Example')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent('1 public member shown.');
    });

    const cardList = screen.getByRole('list', { name: 'Opted-in public member profiles' });
    expect(cardList.children).toHaveLength(1);
  });

  it('renders the /members route inside the XP browser window', async () => {
    window.history.replaceState({}, '', '/members');

    render(
      <UnavailableAuthProvider>
        <App />
      </UnavailableAuthProvider>,
    );

    const searchbox = await screen.findByRole('searchbox', { name: 'Search public members' });
    const browserWindow = document.querySelector('.homepage-window');

    expect(browserWindow).not.toBeNull();
    expect(browserWindow).toContainElement(searchbox);
    expect(screen.getAllByText('https://codehawks.org/members').length).toBeGreaterThan(0);
    expect(document.querySelector('.legal-page-shell')).not.toBeInTheDocument();
  });
});
