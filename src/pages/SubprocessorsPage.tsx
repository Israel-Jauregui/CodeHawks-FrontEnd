import LegalPageLayout from '../components/LegalPageLayout';
import { SITE_IDENTITY } from '../constants/site';
import { usePageMetadata } from '../hooks/usePageMetadata';

export default function SubprocessorsPage() {
  usePageMetadata({
    title: 'Vendors and Service Providers',
    description: 'Current third-party vendors that help CodeHawks authenticate users, host the service, and deliver email.',
    path: '/subprocessors',
  });

  return (
    <LegalPageLayout title="Vendors and Service Providers">
      <p>
        This page lists third parties that may process information while helping CodeHawks operate the service.
        Some organizations use the term “subprocessor”; CodeHawks uses “service provider” here because its precise
        legal role can depend on the context and applicable law.
      </p>

      <div className="legal-page-table-wrapper">
        <table>
          <thead>
            <tr><th>Provider</th><th>Purpose</th><th>Information involved</th><th>Location notes</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Microsoft Corporation (Microsoft Entra ID)</td>
              <td>UNG Microsoft account authentication and delegated access tokens.</td>
              <td>Verified email, display name, tenant and subject identifiers, sign-in/session data.</td>
              <td>Processing follows Microsoft and UNG tenant arrangements.</td>
            </tr>
            <tr>
              <td>Amazon Web Services, Inc. (AWS)</td>
              <td>
                CloudFront site/media delivery; S3 storage; API Gateway and Lambda processing; DynamoDB records;
                CloudWatch logs; SQS queues; SES email delivery.
              </td>
              <td>
                Website requests, member and participation records, uploaded media, operational logs, email
                addresses and delivery data.
              </td>
              <td>Primary application resources are configured in AWS us-east-1; CloudFront uses global edge locations.</td>
            </tr>
            <tr>
              <td>Cloudflare, Inc.</td>
              <td>Authoritative DNS for codehawks.org.</td>
              <td>DNS lookup information handled as part of internet name resolution.</td>
              <td>Website requests are not currently proxied through Cloudflare.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Not current service providers</h2>
      <p>
        CodeHawks does not currently use analytics, advertising pixels, AI APIs, payment processors, or marketing
        automation on this website. GitHub, LinkedIn, Discord, UNG, and UNG Connect may receive information only
        when you choose to follow an external link or otherwise use those separate services.
      </p>

      <h2>Changes</h2>
      <p>
        This list will be updated before a new provider is used to process materially different member data. Send
        vendor or privacy questions to{' '}
        <a href={`mailto:${SITE_IDENTITY.privacyEmail}`}>{SITE_IDENTITY.privacyEmail}</a>.
      </p>
    </LegalPageLayout>
  );
}
