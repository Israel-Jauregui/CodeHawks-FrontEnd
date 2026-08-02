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

Merges to the protected `main` branch run CI but never deploy automatically. A permitted GitHub user must deliberately start **Deploy frontend**, and the job then waits for the repository owner's `frontend-production` approval. After approval it builds the site, assumes a short-lived AWS role through GitHub OIDC, uploads `dist/` to a private S3 bucket, and invalidates CloudFront.

The repository stores no AWS access keys. Terraform lives in [`infrastructure/`](infrastructure/README.md). Configure these variables in the GitHub `frontend-production` environment after applying it:

- `AWS_REGION`
- `AWS_ROLE_ARN`
- `S3_BUCKET`
- `CLOUDFRONT_DISTRIBUTION_ID`

Production deployments use the version on protected `main`, require a manual dispatch, and require a separate protected-environment approval. The workflow remains disabled until the AWS bootstrap and site apply are complete.
