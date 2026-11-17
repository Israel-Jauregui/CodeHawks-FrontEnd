# Runbook

How the site gets from this repository to codehawks.org, and what to do when something needs changing.

## The pieces

| Piece | Where it is defined | Who changes it |
| --- | --- | --- |
| The page | `src/`, `public/`, `index.html` | Anyone, by pull request |
| S3 bucket, CloudFront, certificate, security headers, redirects, budget alert | `infra/` (AWS CDK, stack `SweSite`) | Owner, with the **Deploy infrastructure** workflow |
| GitHub's AWS roles | `infra/` (stack `SweGithubAccess`) | Owner, same workflow |
| DNS and `contact@codehawks.org` forwarding | Cloudflare dashboard | Owner, by hand ([DNS](#dns)) |

AWS account region: `us-east-1`. Nothing else runs in AWS for this site.

## Publish a change to the page

1. Merge the pull request into `main`.
2. **CI** builds the site and stores it as the `site-dist` artifact.
3. **Deploy site** starts on its own and waits. Approve it under Actions → the run → Review deployments.
4. It uploads the files, clears the CloudFront cache and finishes in about two minutes.

**Roll back:** Actions → Deploy site → Run workflow, and give it the ID of an earlier successful CI run on `main` (kept for 30 days). Then revert the commit so `main` matches what is live.

## Change the infrastructure

1. Edit `infra/`, run `npm test` and `npm run synth` there, and merge the pull request.
2. Actions → **Deploy infrastructure** → Run workflow on `main`.
3. Read the `cdk diff` in the first job's summary. If it is what you expect, approve the second job.

If a diff shows the bucket, the distribution or the certificate being **replaced**, stop. A replacement changes the CloudFront hostname and takes the site down until DNS is updated.

## GitHub settings the workflows rely on

Three environments, all restricted to the `main` branch:

| Environment | Required reviewer | Variables |
| --- | --- | --- |
| `production` | Owner | `AWS_ACCOUNT_ID`, `S3_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID` |
| `infrastructure-plan` | None (its role is read-only) | `AWS_ACCOUNT_ID` |
| `infrastructure` | Owner | `AWS_ACCOUNT_ID` |

`S3_BUCKET` and `CLOUDFRONT_DISTRIBUTION_ID` are outputs of the `SweSite` stack. There are no secrets.

Branch protection on `main` requires the checks **Build and lint** and **Infrastructure checks**.

## DNS

The domain's DNS is on Cloudflare. CDK cannot manage Cloudflare, and these records almost never change, so they are kept by hand. All are DNS only (grey cloud), never proxied.

| Record | Type | Value | Why |
| --- | --- | --- | --- |
| `codehawks.org` | CNAME | The `DistributionDomainName` output of `SweSite` (`….cloudfront.net`) | The site. Cloudflare flattens a CNAME at the apex |
| `www.codehawks.org` | CNAME | The same hostname | Redirects to the apex |
| `_….codehawks.org` and `_….www.codehawks.org` | CNAME | `….acm-validations.aws` | Lets AWS renew the HTTPS certificate. **Never delete these** |
| `codehawks.org` | MX ×3, TXT (SPF) | Cloudflare's | `contact@codehawks.org` forwarding. Added and locked by Cloudflare Email Routing |
| `_dmarc.codehawks.org` | TXT | `v=DMARC1; p=none; …` | Email reporting policy |
| `codehawks.org` | TXT | `google-site-verification=…` | Proves the domain to Google Search Console |

If the certificate validation records are lost, `aws acm describe-certificate --certificate-arn <arn> --query Certificate.DomainValidationOptions` prints the names and values to put back.

`contact@codehawks.org` forwards to an officer's mailbox through Cloudflare Email Routing (Email → Email Routing in the dashboard). Change the destination there when officers change.

## Photos

See [CONTRIBUTING.md](../CONTRIBUTING.md#adding-photos). In short: originals into `photos-src/<event>/`, `npm run photos`, write the captions, `npm run photos` again, commit.

## Link preview image

`public/og-swe.png` is a render of `brand/og.html`. After editing the HTML:

```sh
google-chrome --headless=new --hide-scrollbars --virtual-time-budget=8000 \
  --window-size=1200,630 --screenshot=public/og-swe.png brand/og.html
```

It needs network access once, to load JetBrains Mono. Social sites cache previews for days; LinkedIn's Post Inspector and similar tools force a refresh.

## Set it up from nothing

Only needed in a new AWS account. It takes an administrator session on your own machine.

```sh
cd infra && npm ci
npx cdk bootstrap aws://<account-id>/us-east-1
npx cdk deploy SweSite -c attachDomain=false --parameters BudgetEmail=<address for cost alerts>
npx cdk deploy SweGithubAccess -c attachDomain=false
```

- The account must already have the GitHub OIDC provider (`token.actions.githubusercontent.com`). The Hacklonega site shares it.
- The first `SweSite` deploy waits for the certificate. It completes once the two validation CNAMEs are in Cloudflare.
- Copy the stack outputs into the GitHub environment variables above, run **Deploy site**, and check the site on its `cloudfront.net` address.
- The first deploy needs `-c attachDomain=false`, because `infra/cdk.json` has it `true`. To then put the domain on it:
  1. Point the two Cloudflare CNAMEs at the new distribution's `DistributionDomainName`. Nothing changes for visitors yet: CloudFront routes by domain name, so whichever distribution holds `codehawks.org` keeps serving it. Do this first, because CloudFront refuses to add a domain to a distribution while the domain's DNS points at a different one.
  2. Take `codehawks.org` and `www.codehawks.org` off the distribution that holds them now. CloudFront allows a domain on only one distribution. The site is down from here until step 3 finishes, a minute or two.
  3. Deploy `SweSite` with `attachDomain` `true`.

  If step 3 fails, put the domain back on the old distribution straight away. CloudFront takes one certificate change at a time, so that waits until step 2 shows `Deployed`, a few minutes.

## Check that it is healthy

```sh
curl -sI https://codehawks.org/ | grep -iE '^HTTP|content-security-policy|strict-transport'
curl -sI https://www.codehawks.org/ | grep -iE '^HTTP|^location'       # 301 to the apex
curl -sI https://codehawks.org/projects | grep -iE '^HTTP|^location'   # 301 to /
curl -sI https://codehawks.org/nope | grep -i '^HTTP'                  # 404
curl -s https://codehawks.org/sitemap.xml
```
