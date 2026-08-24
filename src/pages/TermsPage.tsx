import LegalPageLayout from '../components/LegalPageLayout';
import { SITE_IDENTITY } from '../constants/site';
import { usePageMetadata } from '../hooks/usePageMetadata';

export default function TermsPage() {
  usePageMetadata({
    title: 'Terms of Use',
    description: 'Rules for using the CodeHawks website and member services.',
    path: '/terms',
  });

  return (
    <LegalPageLayout title="Terms of Use">
      <p>
        These Terms govern use of codehawks.org and CodeHawks member features. By using the service, you agree to
        follow these Terms and applicable University of North Georgia policies. If you do not agree, do not use
        member features.
      </p>

      <h2>1. Service and eligibility</h2>
      <p>
        CodeHawks is a student-organization service for learning, collaboration, events, and club communication.
        It is not an emergency service, an official academic record system, or a substitute for official UNG
        communications. Member accounts require an eligible <code>@ung.edu</code> Microsoft account. You are
        responsible for activity performed through your authenticated account.
      </p>

      <h2>2. Acceptable use</h2>
      <p>You may not use the service to:</p>
      <ul>
        <li>harass, threaten, impersonate, discriminate against, or expose private information about another person;</li>
        <li>upload unlawful, malicious, deceptive, infringing, or unsafe content;</li>
        <li>probe, bypass, disrupt, overload, or gain unauthorized access to the service or another account;</li>
        <li>submit secrets, passwords, regulated records, or other sensitive information the service does not request;</li>
        <li>use project, team, event, or messaging features for spam, commercial advertising, or unrelated solicitation; or</li>
        <li>violate applicable law, UNG policy, event rules, or third-party platform terms.</li>
      </ul>

      <h2>3. Your content</h2>
      <p>
        You keep any ownership rights you have in content you submit. You give CodeHawks a non-exclusive,
        worldwide, royalty-free license to host, copy, display, format, and distribute that content only as needed
        to operate, secure, promote, and improve the club service. You confirm that you have permission to submit
        the content and any personal information it contains.
      </p>
      <p>
        Do not upload confidential code, private repository credentials, personal records, or an image containing
        sensitive metadata. Officers may review, decline, archive, or remove content to enforce these Terms and
        club standards.
      </p>

      <h2>4. Public profiles and shared work</h2>
      <p>
        Public profile visibility is optional and controlled in Profile settings. Shared projects, teams, and event
        information can be visible to visitors even if an individual profile is private; public cards do not list
        member handles. Consider the audience before submitting content or external links.
      </p>

      <h2>5. Optional club announcements</h2>
      <p>
        Club-announcement newsletters are optional. Members can opt in or out in Profile settings. Essential
        service messages needed to complete a requested action may still be sent when necessary.
      </p>

      <h2>6. Account suspension and deletion</h2>
      <p>
        Officers may restrict, suspend, or remove accounts or content when reasonably necessary for security,
        moderation, legal compliance, or enforcement of club and UNG rules. You may delete your CodeHawks account
        from Profile settings. Self-service deletion removes the current profile, identity lookups, indexed
        recipient-side activity, live participation links, and all account avatar objects; it also anonymizes live
        shared references where applicable. Historical authored snapshots, newsletters and delivery records, audits,
        legacy non-indexed activity, owned club content, and project, team, or event media may require an
        officer-assisted review. It does not delete your UNG Microsoft account.
      </p>

      <h2>7. Third-party services and links</h2>
      <p>
        Authentication and hosting depend on Microsoft and Amazon Web Services. The site may also link to UNG,
        UNG Connect, GitHub, LinkedIn, Discord, or other services. CodeHawks does not control third-party services
        and is not responsible for their availability, content, security, or privacy practices.
      </p>

      <h2>8. Intellectual property</h2>
      <p>
        CodeHawks site code, club-created copy, and original graphics are protected to the extent allowed by
        applicable law and their stated licenses. Microsoft, Windows, UNG, GitHub, and other names and marks belong
        to their respective owners. The retro interface is an aesthetic reference and does not imply Microsoft
        sponsorship.
      </p>

      <h2>9. Availability and warranty disclaimer</h2>
      <p>
        This volunteer-run service may change, pause, lose features, or become unavailable. To the fullest extent
        allowed by applicable law, the service is provided <strong>“as is” and “as available”</strong>, without
        warranties of uninterrupted operation, fitness for a particular purpose, non-infringement, or error-free
        content. Nothing here limits a right that cannot legally be waived.
      </p>

      <h2>10. Limitation of responsibility</h2>
      <p>
        To the fullest extent allowed by applicable law, CodeHawks, its student officers, and contributors are not
        responsible for indirect, incidental, special, consequential, or punitive losses arising from use of the
        service, loss of data, third-party links, or volunteer project content. This section does not exclude
        responsibility that applicable law does not permit us to exclude.
      </p>

      <h2>11. Resolving concerns</h2>
      <p>
        Please first contact <a href={`mailto:${SITE_IDENTITY.supportEmail}`}>{SITE_IDENTITY.supportEmail}</a> so
        student officers can review a concern. These Terms do not impose mandatory arbitration or select a court
        or jurisdiction; applicable law and any controlling UNG policies govern unresolved disputes.
      </p>

      <h2>12. Changes and contact</h2>
      <p>
        CodeHawks may update these Terms as the service and organization change. The current version and date will
        remain on this page. Continued use after a posted change means the updated Terms apply going forward. For
        questions, email <a href={`mailto:${SITE_IDENTITY.supportEmail}`}>{SITE_IDENTITY.supportEmail}</a>.
      </p>
    </LegalPageLayout>
  );
}
