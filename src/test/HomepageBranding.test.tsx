import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { UnavailableAuthProvider } from '../auth/AuthContext';
import Homepage from '../pages/Homepage';

describe('homepage club branding', () => {
  it('identifies the current App Development Club across the desktop and open windows', () => {
    render(
      <UnavailableAuthProvider>
        <Homepage />
      </UnavailableAuthProvider>,
    );

    expect(screen.getByRole('button', { name: 'Open ADC Website' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ADC Website' })).toBeInTheDocument();
    expect(screen.getByText('App Development Club at University of North Georgia')).toHaveClass('title-bar-text');
    expect(screen.getByRole('button', { name: 'Get Started' })).toHaveClass('cta-button');
    expect(screen.queryByRole('link', { name: 'Get Started' })).not.toBeInTheDocument();

    const terminalWindow = document.querySelector('.terminal-window');
    expect(terminalWindow).not.toBeNull();
    expect(within(terminalWindow as HTMLElement).getByText('App Development Club')).toHaveClass('title-bar-text');
  });
});
