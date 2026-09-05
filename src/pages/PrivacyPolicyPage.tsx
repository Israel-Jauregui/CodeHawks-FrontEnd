import LegalPageLayout from '../components/LegalPageLayout';
import { SITE_IDENTITY } from '../constants/site';
import { usePageMetadata } from '../hooks/usePageMetadata';

export default function PrivacyPolicyPage() {
  usePageMetadata({
    title: 'Privacy Policy',
    description: 'How CodeHawks collects, uses, shares, retains, and lets members control personal information.',
    path: '/privacy',
  });

  return (
    <LegalPageLayout title="Privacy Policy">
      <p>
        This policy explains how the CodeHawks student organization operates codehawks.org and its member
        services. It covers website visitors and anyone who signs in with an eligible University of North
        Georgia Microsoft account.
      </p>
      <p><strong>Policy version:</strong> {SITE_IDENTITY.privacyPolicyVersion}</p>

      <h2>1. Who operates this service</h2>
      <p>
        The student organization using the public name <strong>{SITE_IDENTITY.publicName}</strong> operates this service. The
        organization is currently registered at {SITE_IDENTITY.universityName} as the
        <strong> {SITE_IDENTITY.registeredOrganizationName}</strong>. The club—not an advertising network—decides how the
        application data described here is used. Organizational rename and contact details are being finalized;
        no mailing address is currently published. Privacy questions can be sent to{' '}
        <a href={`mailto:${SITE_IDENTITY.privacyEmail}`}>{SITE_IDENTITY.privacyEmail}</a>.
      </p>

      <h2>2. Information we collect</h2>
      <h3>When you visit</h3>
      <ul>
        <li>
          AWS access logs record technical request information such as source IP address, request method and
          route, protocol, response status and size, request identifier, and integration errors.
        </li>
        <li>
          The production site does not currently use analytics, advertising pixels, behavioral tracking, AI
          APIs, payment processors, or marketing cookies.
        </li>
      </ul>

      <h3>When you sign in</h3>
      <p>
        Signing in through Microsoft Entra ID creates a CodeHawks member account. We receive and store your
        verified <code>@ung.edu</code> email address, Microsoft identity subject and tenant identifiers, display
        name, a randomly generated non-identifying starter handle, account status and club role, and account
        creation, update, and last-active timestamps. We do not receive your Microsoft password.
      </p>

      <h3>Information you choose to add</h3>
      <ul>
        <li>Profile details such as a bio, major, academic minor(s), technology interests, avatar, and links.</li>
        <li>A user-selected public handle.</li>
        <li>Projects, teams, invitations, join requests, memberships, notifications, and event RSVPs.</li>
        <li>Your choices about public profile visibility and optional club-announcement newsletters.</li>
        <li>
          A history of changes to those two choices, including the previous and new value, member identifier,
          timestamp, self-service source, and the privacy-policy version shown above.
        </li>
        <li>Images you upload for a profile, project, team, or event.</li>
      </ul>
      <p>
        For new uploads, the browser attempts to decode and re-encode an image before upload, which often removes
        embedded EXIF or location metadata. This metadata removal is a best-effort browser measure, not a
        server-enforced guarantee. The server keeps each new upload outside the public media paths, checks its
        size, declared image type, and file signature, and then copies a valid image to a separate public object.
        Invalid and abandoned pending uploads are not published and expire automatically. These checks do not
        guarantee metadata removal. Remove sensitive metadata yourself and do not upload an image you would not
        want stored or displayed.
      </p>

      <h2>3. How we use information</h2>
      <ul>
        <li>Authenticate eligible UNG community members and protect member-only features.</li>
        <li>Operate member profiles, projects, teams, invitations, notifications, and event RSVPs.</li>
        <li>Display a member profile only after that member explicitly enables public visibility.</li>
        <li>Send optional club-announcement newsletters only to members who explicitly opt in.</li>
        <li>Maintain service security, prevent abuse, troubleshoot failures, and recover from outages.</li>
        <li>Enforce club permissions, moderation decisions, and these Terms.</li>
      </ul>

      <h2>4. Public information and your choices</h2>
      <p>
        New member profiles are not intended to appear in the public Members directory unless the member turns on
        <strong> Public profile</strong> in Profile settings. If enabled, the public directory may show the
        member&apos;s handle, display name, bio, avatar, major, academic minor(s), technology interests, and profile
        links. It never intentionally publishes the member&apos;s email address, Microsoft identifiers, club status,
        private activity timestamps, or newsletter preference.
      </p>
      <p>
        Turning public visibility off removes the profile from future directory responses. Search engines, browser
        caches, screenshots, and copies made by other people may take time to disappear and are outside our direct
        control. It does not delete the stored avatar or revoke an unguessable direct media URL that was previously
        shared. Members can use <strong>Remove Current Profile Picture</strong> to delete the current avatar object;
        avatar CDN responses are configured not to be cached so the deleted origin object is not intentionally kept
        at an edge. Shared projects or teams may remain visible, but public cards do not display member handles.
      </p>
      <p>
        Signed-in members creating project invitations can search eligible members after entering at least three
        characters. That limited authenticated lookup returns only an internal member ID, handle, and display name,
        even when the profile is not public. It does not return email, role, timestamps, or optional profile fields.
      </p>

      <h2>5. Optional newsletters</h2>
      <p>
        Club-announcement newsletters are optional and are off unless you opt in. You can change that choice at
        any time in Profile settings. Essential messages needed to complete a requested account or participation
        action are not treated as newsletters. CodeHawks does not currently use member data for third-party
        advertising or sell mailing lists.
      </p>

      <h2>6. Where information goes</h2>
      <p>
        We disclose information only to operate the service, comply with applicable obligations, protect users or
        the service, or respond to a valid legal request. We do not sell or rent personal information. Current
        service providers are listed on the <a href="/subprocessors">Vendors and Service Providers page</a>.
      </p>
      <ul>
        <li><strong>Microsoft Entra ID</strong> provides UNG account authentication.</li>
        <li>
          <strong>Amazon Web Services</strong> provides site delivery, API processing, database and media storage,
          operational logs, message queues, and email delivery.
        </li>
        <li><strong>Cloudflare</strong> provides authoritative DNS; website traffic is not currently proxied through Cloudflare.</li>
      </ul>
      <p>
        Links to GitHub, LinkedIn, Discord, UNG Connect, and other external sites are governed by those services&apos;
        own privacy practices once you follow them.
      </p>

      <h2>7. Retention and deletion</h2>
      <p>
        Except for the log period below, CodeHawks application records currently have no automatic expiration.
        Profiles, account-linked participation records, preferences, and newsletter choices may therefore be kept
        indefinitely while the service operates unless you delete your account or a club officer removes data.
        Shared club-resource content and media may be kept until an officer removes it.
      </p>
      <ul>
        <li><strong>API access and application logs:</strong> automatically retained for 14 days.</li>
        <li>
          <strong>Unfinished image uploads:</strong> uploads first enter a private pending area that the media CDN
          cannot read. A file is copied to a new public key only after server validation and an authorized finalize
          request. Abandoned pending objects automatically expire after approximately one day.
        </li>
        <li>
          <strong>Self-service account deletion:</strong> the Delete account control removes the current profile;
          Microsoft-identity, email, and handle lookup records; recipient-side notifications and invitations;
          preference-change history; indexed event RSVPs; direct live participation links; and all avatar objects
          attributable to that account. It anonymizes live project and team ownership or membership references
          where applicable. For suspended accounts, a minimal school-identity restriction remains to enforce
          the suspension; the profile, email, and handle are still removed.
        </li>
        <li>
          <strong>Records requiring officer-assisted review:</strong> legacy non-indexed RSVPs; authored invitation,
          notification, and join-action snapshots; newsletter authorship, sent messages, and delivery records;
          membership or administration audits; and owned club-resource content are not all discoverable by the
          self-service member index. They may retain a historical handle or pseudonymous member identifier for
          integrity. Contact the officers to request a broader search, export, correction, or removal review.
        </li>
        <li>
          <strong>Club-resource media:</strong> project, team, or event images are not removed automatically with
          account deletion. Contact the officers to request review and removal of those files.
        </li>
        <li>
          <strong>Recovery copies:</strong> recently deleted database information may remain temporarily in
          restricted AWS recovery copies and is used only if disaster recovery is necessary.
        </li>
      </ul>
      <p>
        Deleting a CodeHawks account does not delete the underlying UNG Microsoft account and cannot recall email
        already delivered or copies another person already made. Signing in again after deletion creates a new
        private, unsubscribed CodeHawks profile. For media that remains, email{' '}
        <a href={`mailto:${SITE_IDENTITY.privacyEmail}`}>{SITE_IDENTITY.privacyEmail}</a>.
      </p>

      <h2>8. Browser storage and cookies</h2>
      <p>
        The site stores Microsoft authentication state and bearer tokens in browser session storage so they are
        limited to the current tab session. It also stores the virtual browser&apos;s navigation state in session
        storage and the optional Nighthawk mascot position in local storage. Production member records are stored
        by the backend, not in these browser preferences.
      </p>
      <p>
        A development or demonstration build configured without the backend may also keep mock project, team, and
        join-request state in local storage on that browser. That fallback data is for local demonstration and is
        not a production member record.
      </p>
      <p>
        CodeHawks does not currently set its own cookies for analytics, advertising, or marketing. Microsoft may
        use Microsoft-domain cookies during its sign-in flow under Microsoft and UNG account practices. If
        CodeHawks later adds non-essential tracking, this policy and any required consent controls must be updated
        before that tracking is enabled.
      </p>

      <h2>9. Eligibility and younger members</h2>
      <p>
        Any person able to authenticate with an eligible <code>@ung.edu</code> account may create an account. That
        population can include students under 18, such as dual-enrollment students. CodeHawks does not ask for a
        date of birth and does not intentionally make a profile public by default. A member—or a parent or guardian
        acting where applicable—may contact us about access, correction, or deletion.
      </p>

      <h2>10. Your controls and requests</h2>
      <p>Authenticated members can use Profile settings to:</p>
      <ul>
        <li>correct profile details and change their handle;</li>
        <li>turn public directory visibility on or off;</li>
        <li>opt into or out of optional club-announcement newsletters;</li>
        <li>
          download an export of the data currently discoverable through the member privacy index, including the
          preference-change history; and
        </li>
        <li>run the self-service deletion described above after an explicit destructive confirmation.</li>
      </ul>
      <p>
        For help, questions, or a request you cannot complete while signed in, email{' '}
        <a href={`mailto:${SITE_IDENTITY.privacyEmail}`}>{SITE_IDENTITY.privacyEmail}</a> from your UNG address when
        possible. We may need to verify identity before acting. Depending on your location, applicable law may
        provide additional access, correction, deletion, restriction, objection, or appeal rights.
      </p>

      <h2>11. Security</h2>
      <p>
        CodeHawks uses Microsoft authentication, encrypted HTTPS connections, restricted AWS storage, role-based
        permissions, and bounded operational logging. No online service can guarantee absolute security. Please
        report a suspected privacy or security problem to{' '}
        <a href={`mailto:${SITE_IDENTITY.privacyEmail}`}>{SITE_IDENTITY.privacyEmail}</a> and do not include secrets
        or passwords in the message.
      </p>

      <h2>12. Policy changes</h2>
      <p>
        Material changes will be posted here with a new last-updated date. If a change materially affects a choice
        members previously made, CodeHawks will provide an appropriate notice in the service or by account email.
      </p>
    </LegalPageLayout>
  );
}
