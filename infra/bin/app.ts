import { App } from 'aws-cdk-lib';
import { config } from '../lib/config.ts';
import { GithubAccessStack } from '../lib/github-access-stack.ts';
import { SiteStack } from '../lib/site-stack.ts';

const app = new App();
// The account comes from whoever is deploying; the region is fixed.
const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: config.region };
const tags = { Project: 'swe-site', ManagedBy: 'cdk' };

// Puts codehawks.org on the distribution. True in cdk.json since the cutover on 2026-11-17;
// a first deploy into a new account overrides it with `-c attachDomain=false` (docs/RUNBOOK.md).
const attachDomain = String(app.node.tryGetContext('attachDomain')) === 'true';

const site = new SiteStack(app, 'SweSite', { env, tags, attachDomain, description: 'Static hosting for codehawks.org, the Software Engineering Club @ UNG site' });
new GithubAccessStack(app, 'SweGithubAccess', { env, tags, bucket: site.bucket, distribution: site.distribution, description: 'GitHub Actions deploy roles for the Software Engineering Club @ UNG site' });
