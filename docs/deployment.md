# AWS deployment

The account interface is built as a static Vite artifact and served from a
private S3 bucket through CloudFront. The CloudFront distribution serves the
UI and proxies same-origin `/api/*` requests to the `feednow-auth` HTTP API.
The backend callback uses `https://<account-origin>/api/oauth/callback`; the
edge removes `/api` before forwarding it to the backend `/oauth/callback`
route. API responses keep their status and content type, including errors.

## Coordinated backend and UI deployment

The backend and CloudFront UI use the same standard AWS CLI profile and the
same FeedNow environment file. Keep `deploy/aws/cdk/.env.<environment>` in the
`feednow-auth` checkout, copied from `.env.example`; it contains non-secret
account, region, origin, and optional domain inputs only. Never add AWS
credentials or Google OAuth secret material to it.

From the `feednow-auth` repository, preview and deploy the backend, then
coordinate both services in dependency order:

```sh
deploy/aws/deploy.sh --profile <aws-profile> --env prod diff
deploy/aws/deploy-all.sh --profile <aws-profile> --env prod
```

`deploy-all.sh` deploys the backend first, reads its `ApiEndpoint` output,
configures or verifies the Google IdP through a non-echoing credential prompt,
updates the existing Cognito app client's callback/logout URLs, then runs the
UI checks and deploys the static CloudFront application. Its `--ui` mode skips
backend deployment while synchronizing those redirects before publishing the
UI. The same profile/environment are used throughout; scripts verify the AWS
account against `AWS_ACCOUNT_ID` before making changes.

Set `ACCOUNT_DOMAIN_NAME`, `ACM_CERTIFICATE_ARN` (issued in `us-east-1`), and
`ROUTE53_HOSTED_ZONE_ID` in the backend environment file to use
`account.feednow.io`. Without those values, the UI stack uses its CloudFront
hostname. Cognito callback and logout values derive from `ACCOUNT_BASE_URL`.

## UI infrastructure and upload

The `deploy/aws/account-ui.yaml` template creates an encrypted, private,
versioned S3 bucket; CloudFront OAC; API, immutable asset, and SPA route
behaviors; HTTPS-only viewer access; and security response headers. The
default behavior disables caching and rewrites extensionless browser routes
to `index.html`; hashed `/assets/*` files use CloudFront's optimized cache.
The API behavior is uncached,
forwards cookies, query strings, and viewer headers, and rewrites `/api/*` to
the backend route path.

Run the deployment script from the UI repository after the backend stack is
available:

```sh
deploy/aws/deploy.sh --profile <aws-profile> --env <environment>
```

Omit all three custom-domain variables to use the CloudFront hostname for a
non-production smoke environment. When a custom domain is used, the ACM
certificate must be issued in `us-east-1`, and the hosted zone must contain
the account domain. The script runs `npm run check` and `npm run test:e2e`,
deploys the stack, uploads immutable assets with long cache lifetimes, uploads
`index.html` without caching, then invalidates CloudFront.
It waits for the invalidation and distribution deployment, then checks the
public routes, hashed-asset cache policy, and `/api/*` error behavior through
the selected CloudFront hostname. Success is reported only after these edge
checks pass.

## Release checks

After deployment, verify the output domain over HTTPS, direct loads for `/`,
`/account`, and `/account/admin`, static asset caching, and authenticated
requests through `/api/v1/me`, `/api/v1/csrf`, `/api/v1/services`, and
`/api/logout`. Confirm an unknown `/api/*` route remains an API error rather
than returning the SPA document. Complete a real Cognito login, callback,
logout, organization update, and API-key operation in a non-production
environment before production promotion. Local builds and CloudFormation
template validation do not prove those live flows.
