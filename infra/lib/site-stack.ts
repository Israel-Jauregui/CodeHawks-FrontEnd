import { fileURLToPath } from 'node:url';
import { CfnCondition, CfnOutput, CfnParameter, Duration, Fn, RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as budgets from 'aws-cdk-lib/aws-budgets';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import type { Construct } from 'constructs';
import { config, contentSecurityPolicy } from './config.ts';

export type SiteStackProps = StackProps & {
  // False until cutover: the stack then serves only on its cloudfront.net address, so it can
  // be tested while the old distribution still owns codehawks.org.
  attachDomain: boolean;
};

// Hosting for the static site: a private bucket that only CloudFront can read.
export class SiteStack extends Stack {
  readonly bucket: s3.Bucket;
  readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: SiteStackProps) {
    super(scope, id, props);

    this.bucket = new s3.Bucket(this, 'SiteBucket', {
      bucketName: `swe-site-${this.account}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      // Versioning keeps earlier deploys for 30 days as an emergency rollback.
      versioned: true,
      lifecycleRules: [{ noncurrentVersionExpiration: Duration.days(30), abortIncompleteMultipartUploadAfter: Duration.days(1) }],
      removalPolicy: RemovalPolicy.RETAIN,
    });

    // DNS is on Cloudflare, so CDK cannot create the validation records. ACM asks for the
    // same record for a name every time within one account, and those records are already
    // in Cloudflare from the previous certificate, so this validates on its own. If the
    // records are ever deleted, `aws acm describe-certificate` lists what to add back.
    const certificate = new acm.Certificate(this, 'Certificate', {
      domainName: config.domain,
      subjectAlternativeNames: [config.wwwDomain],
      validation: acm.CertificateValidation.fromDns(),
    });

    const securityHeaders = new cloudfront.ResponseHeadersPolicy(this, 'SecurityHeaders', {
      responseHeadersPolicyName: 'swe-site-security-headers',
      securityHeadersBehavior: {
        contentSecurityPolicy: { contentSecurityPolicy, override: true },
        strictTransportSecurity: { accessControlMaxAge: Duration.days(365), includeSubdomains: true, override: true },
        contentTypeOptions: { override: true },
        frameOptions: { frameOption: cloudfront.HeadersFrameOption.DENY, override: true },
        referrerPolicy: { referrerPolicy: cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN, override: true },
      },
      customHeadersBehavior: {
        customHeaders: [
          { header: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()', override: true },
          { header: 'Cross-Origin-Opener-Policy', value: 'same-origin', override: true },
        ],
      },
    });

    const viewerRequest = new cloudfront.Function(this, 'ViewerRequest', {
      functionName: 'swe-site-viewer-request',
      comment: 'Redirect www to the apex and old member-platform paths to the home page',
      runtime: cloudfront.FunctionRuntime.JS_2_0,
      code: cloudfront.FunctionCode.fromFile({ filePath: fileURLToPath(new URL('../functions/viewer-request.js', import.meta.url)) }),
    });

    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      comment: 'swe-site',
      defaultRootObject: 'index.html',
      domainNames: props.attachDomain ? [config.domain, config.wwwDomain] : undefined,
      certificate: props.attachDomain ? certificate : undefined,
      minimumProtocolVersion: props.attachDomain ? cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021 : undefined,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
        responseHeadersPolicy: securityHeaders,
        functionAssociations: [{ function: viewerRequest, eventType: cloudfront.FunctionEventType.VIEWER_REQUEST }],
      },
      // One page and no client routes: an unknown path is a real 404. S3 answers 403 for a
      // missing key it will not list, so both map to the 404 page.
      errorResponses: [403, 404].map(httpStatus => ({ httpStatus, responseHttpStatus: 404, responsePagePath: '/404.html', ttl: Duration.minutes(1) })),
    });

    // Lets S3 answer 404 rather than 403 for a missing key.
    this.bucket.addToResourcePolicy(new iam.PolicyStatement({
      sid: 'CloudFrontList',
      actions: ['s3:ListBucket'],
      resources: [this.bucket.bucketArn],
      principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
      conditions: { StringEquals: { 'AWS:SourceArn': this.distribution.distributionArn } },
    }));

    // A static site should cost cents. The alert is only created when an address is given:
    //   cdk deploy SweSite --parameters BudgetEmail=you@example.com
    // CloudFormation remembers the value, so later deploys do not need it again and the
    // address never has to be committed to this public repository.
    const budgetEmail = new CfnParameter(this, 'BudgetEmail', { type: 'String', default: '', noEcho: true, description: 'Where the monthly cost alert goes. Empty for no alert.' });
    const hasBudgetEmail = new CfnCondition(this, 'HasBudgetEmail', { expression: Fn.conditionNot(Fn.conditionEquals(budgetEmail.valueAsString, '')) });
    const subscribers = [{ subscriptionType: 'EMAIL', address: budgetEmail.valueAsString }];
    const budget = new budgets.CfnBudget(this, 'MonthlyBudget', {
      budget: { budgetName: 'swe-site-monthly', budgetType: 'COST', timeUnit: 'MONTHLY', budgetLimit: { amount: config.budgetUsd, unit: 'USD' } },
      notificationsWithSubscribers: [
        { notification: { notificationType: 'ACTUAL', comparisonOperator: 'GREATER_THAN', threshold: 50, thresholdType: 'PERCENTAGE' }, subscribers },
        { notification: { notificationType: 'ACTUAL', comparisonOperator: 'GREATER_THAN', threshold: 100, thresholdType: 'PERCENTAGE' }, subscribers },
        { notification: { notificationType: 'FORECASTED', comparisonOperator: 'GREATER_THAN', threshold: 100, thresholdType: 'PERCENTAGE' }, subscribers },
      ],
    });
    budget.cfnOptions.condition = hasBudgetEmail;

    new CfnOutput(this, 'BucketName', { value: this.bucket.bucketName, description: 'GitHub variable S3_BUCKET' });
    new CfnOutput(this, 'DistributionId', { value: this.distribution.distributionId, description: 'GitHub variable CLOUDFRONT_DISTRIBUTION_ID' });
    new CfnOutput(this, 'DistributionDomainName', { value: this.distribution.distributionDomainName, description: 'What the two Cloudflare CNAME records point to' });
  }
}
