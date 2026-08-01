# CodeHawks Frontend

React and Vite frontend for the University of North Georgia App Development Club.

## Local development

```sh
npm ci
npm run dev
```

Before opening a pull request:

```sh
npm run lint
npm run build
```

The application uses local mock club data until the backend migration is ready.

## Production deployment

Merges to the protected `main` branch run CI and request an owner-approved deployment to AWS. The production job builds the site, assumes a short-lived AWS role through GitHub OIDC, uploads `dist/` to a private S3 bucket, and invalidates CloudFront.

The repository stores no AWS access keys. Configure these variables in the GitHub `production` environment after applying the infrastructure repository:

- `AWS_REGION`
- `AWS_ROLE_ARN`
- `S3_BUCKET`
- `CLOUDFRONT_DISTRIBUTION_ID`

Production deployments do not have a manual dispatch trigger. They can originate only from `main` and must be approved in the protected GitHub environment.
