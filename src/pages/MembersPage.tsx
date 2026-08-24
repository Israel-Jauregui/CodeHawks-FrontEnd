import LegalPageLayout from '../components/LegalPageLayout';
import MembersDirectory from '../components/MembersDirectory';
import { usePageMetadata } from '../hooks/usePageMetadata';

export default function MembersPage() {
  usePageMetadata({
    title: 'Members',
    description: 'Browse CodeHawks members who explicitly opted into the public member directory.',
    path: '/members',
  });

  return (
    <LegalPageLayout title="Members" showUpdated={false}>
      <MembersDirectory />
    </LegalPageLayout>
  );
}
