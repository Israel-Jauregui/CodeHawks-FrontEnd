import LegalPageLayout from '../components/LegalPageLayout';
import { usePageMetadata } from '../hooks/usePageMetadata';

export default function NotFoundPage() {
  usePageMetadata({
    title: 'Page Not Found',
    description: 'The requested CodeHawks page could not be found.',
    path: window.location.pathname,
    noIndex: true,
  });

  return (
    <LegalPageLayout title="404 - Page Not Found" showIdentityNotice={false} showUpdated={false}>
      <p>The requested page does not exist or may have moved.</p>
      <p><a href="/">Return to the CodeHawks home page</a> or visit the <a href="/members">Members directory</a>.</p>
    </LegalPageLayout>
  );
}
