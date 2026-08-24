import type { ReactNode } from 'react';
import { ORGANIZATION_TRANSITION_NOTICE, SITE_IDENTITY } from '../constants/site';
import LegalFooter from './LegalFooter';
import './LegalPageLayout.css';

interface LegalPageLayoutProps {
  children: ReactNode;
  title: string;
  updated?: string;
  showIdentityNotice?: boolean;
  showUpdated?: boolean;
}

export default function LegalPageLayout({
  children,
  title,
  updated = SITE_IDENTITY.effectiveDate,
  showIdentityNotice = true,
  showUpdated = true,
}: LegalPageLayoutProps) {
  return (
    <div className="legal-page-shell">
      <header className="legal-page-header window">
        <div className="title-bar">
          <div className="title-bar-text">{title} - {SITE_IDENTITY.publicName}</div>
        </div>
        <div className="window-body legal-page-header__body">
          <a className="legal-page-header__brand" href="/">{SITE_IDENTITY.publicName}</a>
          <nav aria-label="Primary">
            <a href="/">Home</a>
            <a href="/members">Members</a>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="/accessibility">Accessibility</a>
          </nav>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="legal-page-main window">
        <div className="title-bar">
          <div className="title-bar-text">{title}</div>
        </div>
        <article className="window-body legal-page-content">
          <h1>{title}</h1>
          {showUpdated && <p className="legal-page-content__updated"><strong>Effective and last updated:</strong> {updated}</p>}
          {showIdentityNotice && (
            <div className="legal-page-content__notice" role="note">
              <strong>Organization identity notice.</strong> {ORGANIZATION_TRANSITION_NOTICE}
            </div>
          )}
          {children}
        </article>
      </main>

      <LegalFooter />
    </div>
  );
}
