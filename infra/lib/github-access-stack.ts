import { CfnOutput, Duration, Stack, type StackProps } from 'aws-cdk-lib';
import type * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as iam from 'aws-cdk-lib/aws-iam';
import type * as s3 from 'aws-cdk-lib/aws-s3';
import type { Construct } from 'constructs';
import { config } from './config.ts';

export type GithubAccessStackProps = StackProps & {
  bucket: s3.IBucket;
  distribution: cloudfront.IDistribution;
};

// The three roles GitHub Actions can assume. No AWS keys are stored anywhere: each workflow run
// trades a short-lived GitHub token for a short-lived AWS session, and only a run inside the
// named GitHub environment (which has an approval gate) is trusted.
export class GithubAccessStack extends Stack {
  constructor(scope: Construct, id: string, props: GithubAccessStackProps) {
    super(scope, id, props);

    // The account already has GitHub's OIDC provider, and the Hacklonega site's roles use it
    // too, so it is referenced here and never created or deleted by this app.
    const provider = iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn(
      this, 'GithubProvider', `arn:${this.partition}:iam::${this.account}:oidc-provider/token.actions.githubusercontent.com`);
    const runsIn = (environment: string) => new iam.OpenIdConnectPrincipal(provider, {
      StringEquals: {
        'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
        'token.actions.githubusercontent.com:sub': `${config.githubSubject}:environment:${environment}`,
      },
    });

    // Publishes the built site. It can touch one bucket and one distribution, nothing else.
    const siteDeploy = new iam.Role(this, 'SiteDeployRole', {
      roleName: 'swe-site-deploy',
      description: 'GitHub Actions: sync the built site to S3 and invalidate CloudFront',
      assumedBy: runsIn(config.siteEnvironment),
      maxSessionDuration: Duration.hours(1),
    });
    siteDeploy.addToPolicy(new iam.PolicyStatement({ actions: ['s3:ListBucket', 's3:GetBucketLocation'], resources: [props.bucket.bucketArn] }));
    siteDeploy.addToPolicy(new iam.PolicyStatement({ actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'], resources: [props.bucket.arnForObjects('*')] }));
    siteDeploy.addToPolicy(new iam.PolicyStatement({
      actions: ['cloudfront:CreateInvalidation', 'cloudfront:GetInvalidation'],
      resources: [`arn:${this.partition}:cloudfront::${this.account}:distribution/${props.distribution.distributionId}`],
    }));

    const bootstrapRole = (name: string) => `arn:${this.partition}:iam::${this.account}:role/cdk-hnb659fds-${name}-role-${this.account}-${this.region}`;

    // Runs `cdk diff` before anyone approves anything, so it gets read access only: the
    // lookup role that `cdk bootstrap` created.
    const infraPlan = new iam.Role(this, 'InfraPlanRole', {
      roleName: 'swe-site-infra-plan',
      description: 'GitHub Actions: cdk diff for the club site (read only)',
      assumedBy: runsIn(config.planEnvironment),
      maxSessionDuration: Duration.hours(1),
    });
    infraPlan.addToPolicy(new iam.PolicyStatement({ actions: ['sts:AssumeRole'], resources: [bootstrapRole('lookup')] }));

    // Runs `cdk deploy` after approval. It holds no permissions of its own beyond assuming
    // the roles `cdk bootstrap` created, which is how every CDK deployment works.
    const infraDeploy = new iam.Role(this, 'InfraDeployRole', {
      roleName: 'swe-site-infra',
      description: 'GitHub Actions: cdk deploy for the club site',
      assumedBy: runsIn(config.infraEnvironment),
      maxSessionDuration: Duration.hours(1),
    });
    infraDeploy.addToPolicy(new iam.PolicyStatement({
      actions: ['sts:AssumeRole'],
      resources: [bootstrapRole('*')],
    }));

    new CfnOutput(this, 'SiteDeployRoleArn', { value: siteDeploy.roleArn });
    new CfnOutput(this, 'InfraPlanRoleArn', { value: infraPlan.roleArn });
    new CfnOutput(this, 'InfraDeployRoleArn', { value: infraDeploy.roleArn });
  }
}
