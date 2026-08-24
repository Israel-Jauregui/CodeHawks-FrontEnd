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
npm test
npm run build
```

`npm test` first runs the TypeScript compiler in strict, no-output mode and then runs the
Vitest/React Testing Library behavioral suite in jsdom. ESLint continues to cover the JavaScript
and JSX entrypoints. The current stable `typescript-eslint` release declares TypeScript support
only through versions below 6.1, while this project uses TypeScript 7, so TypeScript/TSX files use
the compiler as their supported static check instead of forcing an incompatible ESLint parser.

The application defaults to local mock club data. Copy `.env.example` to `.env.local`, switch
`VITE_CLUB_DATA_SOURCE` to `api`, and fill in the API Gateway and Microsoft Entra values to
exercise the serverless backend. The browser sends an Entra API access token—not an ID token—to
protected `/v1` routes. Public projects, teams, and events do not require sign-in.

Authenticated members can attach JPEG, PNG, or WebP images up to 5 MiB while creating projects,
teams, and events or editing their avatar. The frontend creates the resource, requests its
owner-authorized presigned upload, uploads directly to a non-public S3 pending key, and asks the API
to validate, finalize, and attach it. Cards use the bundled XP placeholder whenever no image is
attached. Avatar replacement and removal use API-owned cleanup rather than accepting arbitrary URLs.

## Production deployment

Merges to the protected `main` branch run CI but never deploy automatically. A permitted GitHub user must deliberately start **Deploy frontend**, and the job then waits for the repository owner's `frontend-production` approval. After approval it builds the site, assumes a short-lived AWS role through GitHub OIDC, uploads `dist/` to a private S3 bucket, and invalidates CloudFront.

The repository stores no AWS access keys. Terraform lives in [`infrastructure/`](infrastructure/README.md). Configure these variables in the GitHub `frontend-production` environment after applying it:

- `AWS_REGION`
- `AWS_ROLE_ARN`
- `S3_BUCKET`
- `CLOUDFRONT_DISTRIBUTION_ID`
- `VITE_API_BASE_URL`
- `VITE_ENTRA_TENANT_ID`
- `VITE_ENTRA_SPA_CLIENT_ID`
- `VITE_ENTRA_API_SCOPE`

Production deployments use the version on protected `main`, require a manual dispatch, and require a separate protected-environment approval. The workflow remains disabled until the AWS bootstrap and site apply are complete.
