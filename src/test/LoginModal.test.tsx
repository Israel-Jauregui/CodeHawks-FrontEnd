import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginModal from '../components/LoginModal';

const authMocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

vi.mock('../auth/AuthContext', () => ({
  useAuth: authMocks.useAuth,
}));

function LoginHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Open sign in</button>
      <LoginModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

describe('login just-in-time privacy notice', () => {
  beforeEach(() => {
    authMocks.useAuth.mockReturnValue({
      isAvailable: true,
      isLoading: false,
      error: null,
      login: vi.fn().mockResolvedValue(undefined),
    });
  });

  it('explains account creation before sign-in, focuses the action, and restores focus on Escape', async () => {
    const user = userEvent.setup();
    render(<LoginHarness />);

    const opener = screen.getByRole('button', { name: 'Open sign in' });
    await user.click(opener);

    const dialog = screen.getByRole('dialog', { name: 'CodeHawks Member Sign In' });
    expect(dialog).toHaveAccessibleDescription(/Continuing creates a CodeHawks account/);
    expect(screen.getByText(/Public profile visibility and optional club-announcement emails are off by default/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy');
    expect(screen.getByRole('link', { name: 'Terms of Use' })).toHaveAttribute('href', '/terms');

    const signIn = screen.getByRole('button', { name: 'Sign in with Microsoft' });
    await waitFor(() => expect(signIn).toHaveFocus());

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(opener).toHaveFocus());
  });
});
