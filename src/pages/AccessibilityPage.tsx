import LegalPageLayout from '../components/LegalPageLayout';
import { SITE_IDENTITY } from '../constants/site';
import { usePageMetadata } from '../hooks/usePageMetadata';

export default function AccessibilityPage() {
  usePageMetadata({
    title: 'Accessibility Statement',
    description: 'CodeHawks accessibility goals, current support, and how to request help or report a barrier.',
    path: '/accessibility',
  });

  return (
    <LegalPageLayout title="Accessibility Statement">
      <p>
        CodeHawks wants people with disabilities to be able to use codehawks.org and participate in club
        activities. We aim to support the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA, but we are not
        claiming that every page or interaction currently conforms.
      </p>

      <h2>Accessibility measures</h2>
      <ul>
        <li>semantic page landmarks, headings, labels, and a skip-to-content link;</li>
        <li>keyboard-visible focus indicators and keyboard-operable actions;</li>
        <li>focus management and Escape-key support for modal dialogs;</li>
        <li>status and validation messages exposed to assistive technology;</li>
        <li>responsive layouts intended to reflow at 320 CSS pixels; and</li>
        <li>descriptive alternatives for meaningful images and hidden decorative imagery.</li>
      </ul>

      <h2>Known limitations</h2>
      <p>
        The site deliberately recreates a Windows XP desktop, including movable windows and dense browser chrome.
        Some retro interactions, third-party content reached through links, and newly added member content may
        still present accessibility barriers. We are continuing to test keyboard navigation, screen-reader output,
        zoom and reflow, color contrast, and motion preferences.
      </p>

      <h2>Get help or report a barrier</h2>
      <p>
        Email <a href={`mailto:${SITE_IDENTITY.supportEmail}`}>{SITE_IDENTITY.supportEmail}</a> with the page or
        feature involved, what you were trying to do, and—if you are comfortable sharing it—the browser and
        assistive technology used. Do not send passwords or authentication tokens. We will make a good-faith effort
        to provide the information or activity in another usable format while the barrier is reviewed.
      </p>

      <h2>Feedback scope</h2>
      <p>
        This statement covers codehawks.org. Accessibility issues on Microsoft sign-in, UNG Connect, GitHub,
        Discord, LinkedIn, or other linked services are controlled by those providers, but we still welcome notice
        when a linked workflow blocks participation.
      </p>
    </LegalPageLayout>
  );
}
