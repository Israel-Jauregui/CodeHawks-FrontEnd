// The few facts the infrastructure is built from.
export const config = {
  region: 'us-east-1', // CloudFront only accepts certificates from us-east-1.
  domain: 'codehawks.org',
  wwwDomain: 'www.codehawks.org',
  budgetUsd: 10,
  // GitHub signs each workflow run with these immutable IDs, so a renamed or re-created
  // repository cannot assume the roles. Read them with:
  //   gh api repos/Israel-Jauregui/CodeHawks-FrontEnd/actions/oidc/customization/sub
  githubSubject: 'repo:Israel-Jauregui@29392107/CodeHawks-FrontEnd@1319366708',
  // The GitHub environments each role trusts. `production` and `infrastructure` have an
  // approval gate; `infrastructure-plan` has none, and its role can only read.
  siteEnvironment: 'production',
  planEnvironment: 'infrastructure-plan',
  infraEnvironment: 'infrastructure',
} as const;

// No inline scripts or styles and no other origins. tests/site.test.mjs in the site checks
// the page against this; if you add something the page needs, change both.
export const contentSecurityPolicy = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self'",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ');
