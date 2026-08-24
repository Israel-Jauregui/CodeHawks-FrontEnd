import { ORGANIZATION_TRANSITION_NOTICE, SITE_IDENTITY } from '../constants/site';
import './LegalFooter.css';

interface LegalFooterProps {
  compact?: boolean;
}

const legalLinks = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/subprocessors', label: 'Vendors' },
  { href: '/accessibility', label: 'Accessibility' },
] as const;

export default function LegalFooter({ compact = false }: LegalFooterProps) {
  if (compact) {
    return (
      <nav className="legal-footer legal-footer--compact" aria-label="Legal and privacy">
        {legalLinks.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}
      </nav>
    );
  }

  return (
    <footer className="legal-footer">
      <nav className="legal-footer__links" aria-label="Legal and privacy">
        <a href="/">Home</a>
        <a href="/members">Members</a>
        {legalLinks.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}
      </nav>
      <p>{ORGANIZATION_TRANSITION_NOTICE}</p>
      <p>
        Questions? Email <a href={`mailto:${SITE_IDENTITY.supportEmail}`}>{SITE_IDENTITY.supportEmail}</a>.
      </p>
    </footer>
  );
}
