# Deploying TruthRouter to Vercel

This repository is prepared for one Vercel project at the monorepo root. The
Vite client is served as static files and the existing Express app is exposed
through Node.js Functions under `/api`. Replit workflows and local development
configuration remain available.

## Import and build

1. Import the Git repository into Vercel as one project.
2. Set **Root Directory** to the repository root (`.`), not either artifact.
3. Use pnpm (detected from `pnpm-lock.yaml`), the Node.js runtime, and the
   committed build command `pnpm run build:vercel`. That command typechecks the
   shared workspace libraries, bundles the Express app for the API functions,
   and builds the TruthRouter Vite frontend; it does not run the
   preview/mockup sandbox.
4. The static output directory is
   `artifacts/truthrouter-web/dist/public`. `vercel.json` declares it and also
   sends client-side routes to `index.html`. Existing filesystem endpoints
   (including the `/api` functions) are resolved before that fallback; the
   fallback pattern explicitly excludes `/api` so an unknown API route cannot
   receive the SPA HTML.

The API entrypoints in `api/index.ts` and `api/[...path].ts` import the
standalone `artifacts/api-server/dist/vercel-app.mjs` bundle, which is created
before Vercel packages the functions. It exports the existing Express app
without starting a listener; the `.mjs` declaration and generated bundle are
included in function tracing. The catch-all handles `/api/...` while the index
entrypoint handles `/api`. Requests stay same-origin, and the Express app
continues to own the `/api` route prefix. API functions are configured with a
90-second limit for the review-provider request.

## Environment and database

Use `.env.vercel.example` as a **names-only template**. Do not commit real
credentials or put server secrets in variables prefixed with `VITE_`. Configure
the values in Vercel's Environment Variables settings for the intended
Production and Preview environments:

- `DATABASE_URL`: a PostgreSQL URL from a Vercel Marketplace database
  integration (or another reachable managed PostgreSQL provider). Prefer the
  provider's pooled connection URL for serverless workloads.
- `SESSION_SECRET`: one stable, high-entropy secret (at least 32 random bytes).
  Do not rotate it casually: anonymous review allowance cookies are signed with
  it. Production requests that issue anonymous visitor cookies fail explicitly
  when it is missing.
- `XAI_API_KEY`: the xAI key used for review generation.
- `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_PUBLISHABLE_KEY`, and
  `CLERK_SECRET_KEY`: keys from a Clerk application that you own. Use that
  application's live keys for Production and the appropriate test keys for
  Preview. The Vercel build command enables the Clerk frontend provider when
  `VERCEL=1`; the API also selects Clerk automatically in Vercel Functions.
- `AUTH_PROVIDER=clerk` is an optional explicit opt-in outside Vercel. When
  developing against an external Clerk app locally, set it along with
  `VITE_AUTH_PROVIDER=clerk` and the corresponding public/server keys.
- `ADMIN_USER_IDS` and `ADMIN_EMAILS` are optional administrator allowlists;
  configure them with the identities from the external Clerk app.

Before deploying, configure your own Clerk app's allowed origins/redirect URLs
for the Vercel Preview and Production domains. The browser and API use the
standard Clerk endpoints and external keys; do not set
`VITE_CLERK_PROXY_URL` on Vercel.

Vercel does not provide persistent PostgreSQL storage by itself. A Marketplace
database is still a managed external service, but it does not require a
separate application server. After provisioning it, manually apply the schema
defined in `lib/db/src/schema` to that external database. If using the existing
Drizzle push command, run `pnpm --filter @workspace/db run push` from a trusted
local shell only after checking that `DATABASE_URL` points to the intended
external database. Schema changes are not run during a Vercel build or function
startup. Do not use a Replit production migration script or `push-force` for
this deployment.

## Authentication

The existing Replit OIDC flow remains the default for local Replit development.
In Vercel Functions, the application instead validates Clerk sessions, looks
up the external Clerk profile, and upserts that user into the existing users
table before populating `req.user`. The shared frontend auth hook uses the
branded `/sign-in` and `/sign-up` routes and Clerk logout in this mode. Existing
admin checks, subscription handling, and quota logic remain in place.

This is an opt-in integration for an independently owned Clerk application;
it does not migrate or provision the Replit-managed Clerk tenant, change
secrets, or make that tenant exportable. Supply your own Clerk live keys in
Vercel before deploying and configure the app's allowed domains and redirect
URLs. Clerk user IDs are the database identity in this mode. Existing rows
associated with Replit OIDC user IDs are not automatically linked or migrated.