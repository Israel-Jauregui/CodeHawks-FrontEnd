import assert from 'node:assert/strict';
import test from 'node:test';
import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { config, contentSecurityPolicy } from '../lib/config.ts';
import { GithubAccessStack } from '../lib/github-access-stack.ts';
import { SiteStack } from '../lib/site-stack.ts';

const build = (attachDomain: boolean) => {
  const app = new App();
  const env = { account: '111111111111', region: config.region };
  const site = new SiteStack(app, 'Site', { env, attachDomain });
  const access = new GithubAccessStack(app, 'Access', { env, bucket: site.bucket, distribution: site.distribution });
  return { site: Template.fromStack(site), access: Template.fromStack(access) };
};

test('the bucket is private, encrypted, versioned and kept if the stack is deleted', () => {
  const { site } = build(false);
  site.hasResource('AWS::S3::Bucket', {
    DeletionPolicy: 'Retain',
    Properties: {
      PublicAccessBlockConfiguration: { BlockPublicAcls: true, BlockPublicPolicy: true, IgnorePublicAcls: true, RestrictPublicBuckets: true },
      VersioningConfiguration: { Status: 'Enabled' },
      BucketEncryption: Match.anyValue(),
    },
  });
  const policy = JSON.stringify(site.findResources('AWS::S3::BucketPolicy'));
  assert.ok(policy.includes('cloudfront.amazonaws.com'), 'CloudFront can read');
  assert.ok(policy.includes('aws:SecureTransport'), 'plain HTTP is denied');
  assert.ok(!policy.includes('"Principal":"*","Action":"s3:GetObject"'), 'no public read');
});

test('the security headers carry the strict policy', () => {
  const { site } = build(false);
  site.hasResourceProperties('AWS::CloudFront::ResponseHeadersPolicy', {
    ResponseHeadersPolicyConfig: {
      SecurityHeadersConfig: {
        ContentSecurityPolicy: { ContentSecurityPolicy: Match.stringLikeRegexp("^default-src 'none'; script-src 'self'; style-src 'self';"), Override: true },
        StrictTransportSecurity: { AccessControlMaxAgeSec: 31536000, Override: true },
        FrameOptions: { FrameOption: 'DENY', Override: true },
        ContentTypeOptions: { Override: true },
      },
    },
  });
  for (const loose of ["'unsafe-inline'", "'unsafe-eval'", '*', 'https:', 'data:']) {
    assert.ok(!contentSecurityPolicy.includes(loose), `the CSP must not contain ${loose}`);
  }
});

test('the distribution is HTTPS only, runs the redirect function and serves real 404s', () => {
  const { site } = build(false);
  site.hasResourceProperties('AWS::CloudFront::Distribution', {
    DistributionConfig: {
      DefaultRootObject: 'index.html',
      DefaultCacheBehavior: {
        ViewerProtocolPolicy: 'redirect-to-https',
        FunctionAssociations: [Match.objectLike({ EventType: 'viewer-request' })],
        ResponseHeadersPolicyId: Match.anyValue(),
      },
      CustomErrorResponses: Match.arrayWith([Match.objectLike({ ErrorCode: 404, ResponseCode: 404, ResponsePagePath: '/404.html' })]),
      Origins: [Match.objectLike({ OriginAccessControlId: Match.anyValue() })],
    },
  });
  site.resourceCountIs('AWS::CloudFront::Function', 1);
});

test('the domain is attached only when asked', () => {
  build(false).site.hasResourceProperties('AWS::CloudFront::Distribution', { DistributionConfig: { Aliases: Match.absent() } });
  build(true).site.hasResourceProperties('AWS::CloudFront::Distribution', {
    DistributionConfig: {
      Aliases: [config.domain, config.wwwDomain],
      ViewerCertificate: { MinimumProtocolVersion: 'TLSv1.2_2021', SslSupportMethod: 'sni-only' },
    },
  });
  // The certificate exists either way, so it is issued and ready before cutover.
  build(false).site.hasResourceProperties('AWS::CertificateManager::Certificate', { DomainName: config.domain, SubjectAlternativeNames: [config.wwwDomain], ValidationMethod: 'DNS' });
});

test('GitHub roles trust only this repository’s gated environments', () => {
  const { access } = build(false);
  const roles = Object.values(access.findResources('AWS::IAM::Role')) as any[];
  assert.equal(roles.length, 3);
  const subjects = roles.map(role => role.Properties.AssumeRolePolicyDocument.Statement[0].Condition.StringEquals['token.actions.githubusercontent.com:sub']).sort();
  assert.deepEqual(subjects, ['infrastructure', 'infrastructure-plan', 'production'].map(environment => `${config.githubSubject}:environment:${environment}`));
  for (const subject of subjects) assert.ok(!subject.includes('*'));
  // No role is created with a managed admin policy, and the stack creates no OIDC provider.
  for (const role of roles) assert.equal(role.Properties.ManagedPolicyArns, undefined);
  access.resourceCountIs('Custom::AWSCDKOpenIdConnectProvider', 0);
  access.resourceCountIs('AWS::IAM::OIDCProvider', 0);
});

test('the site deploy role can reach one bucket and one distribution', () => {
  const { access } = build(false);
  const policies = Object.entries(access.findResources('AWS::IAM::Policy')) as [string, any][];
  const [, sitePolicy] = policies.find(([name]) => name.startsWith('SiteDeployRole'))!;
  const actions = sitePolicy.Properties.PolicyDocument.Statement.flatMap((statement: any) => statement.Action).sort();
  assert.deepEqual(actions, ['cloudfront:CreateInvalidation', 'cloudfront:GetInvalidation', 's3:DeleteObject', 's3:GetBucketLocation', 's3:GetObject', 's3:ListBucket', 's3:PutObject']);
  for (const statement of sitePolicy.Properties.PolicyDocument.Statement) assert.notEqual(statement.Resource, '*');
});

test('the ungated plan role can only read', () => {
  const { access } = build(false);
  const policies = Object.entries(access.findResources('AWS::IAM::Policy')) as [string, any][];
  const [, planPolicy] = policies.find(([name]) => name.startsWith('InfraPlanRole'))!;
  const resources = JSON.stringify(planPolicy.Properties.PolicyDocument.Statement.map((statement: any) => statement.Resource));
  assert.ok(resources.includes('cdk-hnb659fds-lookup-role-'), 'it assumes the read-only lookup role');
  for (const powerful of ['deploy-role', 'cfn-exec-role', 'file-publishing-role', 'hnb659fds-*']) assert.ok(!resources.includes(powerful), powerful);
});
