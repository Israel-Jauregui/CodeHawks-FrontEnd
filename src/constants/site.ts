export const SITE_IDENTITY = {
  publicName: 'CodeHawks',
  currentClubName: 'App Development Club',
  websiteShortcutName: 'ADC Website',
  registeredOrganizationName: 'Application Development Club',
  universityName: 'University of North Georgia',
  canonicalOrigin: 'https://codehawks.org',
  privacyEmail: 'contact@codehawks.org',
  supportEmail: 'contact@codehawks.org',
  effectiveDate: 'August 23, 2026',
  privacyPolicyVersion: '2026-08-23-v1',
} as const;

export const ORGANIZATION_IDENTITY_NOTICE =
  'CodeHawks is our public-facing name; App Development Club is our internal name.';

export const SITE_DESCRIPTION =
  'CodeHawks is a University of North Georgia student organization where students learn, build software, and connect with other developers.';

export function canonicalUrl(path = '/'): string {
  return new URL(path, SITE_IDENTITY.canonicalOrigin).toString();
}
