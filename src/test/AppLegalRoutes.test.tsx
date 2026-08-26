import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '../App';

describe('legal route rendering', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/privacy/');
  });

  it('renders the privacy policy for a trailing-slash route and publishes its metadata', async () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent(
      'CodeHawks is our public-facing name; App Development Club is our internal name.',
    );
    expect(screen.getByRole('note')).not.toHaveTextContent('still being finalized');
    expect(screen.getByRole('link', { name: 'Vendors and Service Providers page' })).toHaveAttribute(
      'href',
      '/subprocessors',
    );

    await waitFor(() => {
      expect(document.title).toBe('Privacy Policy | CodeHawks');
      expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
        'href',
        'https://codehawks.org/privacy',
      );
      expect(document.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
    });
  });

  it('uses the real not-found view for an unknown path', () => {
    window.history.replaceState({}, '', '/not-a-real-codehawks-page');

    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: '404 - Page Not Found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Return to the CodeHawks home page/i })).toHaveAttribute('href', '/');
  });
});
