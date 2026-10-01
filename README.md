
<div align="center">

<h1>TruthRouter AI</h1>

<p><strong>Every product has a flaw. We route you to it.</strong></p>

<p>
AI-powered product research that puts potential pitfalls before the praise.
Get product verdicts, compare alternatives, and explore source links before buying.
</p>

<p>
<img alt="React" src="https://img.shields.io/badge/React-19-149ECA?style=for-the-badge&logo=react&logoColor=white">
<img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white">
<img alt="Vite" src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white">
<img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white">
</p>

<p>
<img alt="Express" src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white">
<img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white">
<img alt="Clerk" src="https://img.shields.io/badge/Clerk-6C47FF?style=for-the-badge&logo=clerk&logoColor=white">
<img alt="Vercel" src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white">
</p>

<p>
<img alt="AI provider" src="https://img.shields.io/badge/AI-xAI-0E1420?style=flat-square">
<img alt="Package manager" src="https://img.shields.io/badge/package_manager-pnpm-F69220?style=flat-square&logo=pnpm&logoColor=white">
<img alt="Responsive interface" src="https://img.shields.io/badge/interface-responsive-1B39FF?style=flat-square">
<img alt="Anonymous access" src="https://img.shields.io/badge/anonymous_access-first_10_reviews-22C55E?style=flat-square">
</p>

<p><sub>A product of <strong>Novatratech SMC Private Limited</strong></sub></p>

</div>

---

## Overview

TruthRouter AI helps buyers research products before making a purchase.

Enter a product name to generate an AI-powered verdict, or compare two products with a query such as:

```text
MacBook Air M4 vs Dell XPS 14
```

The platform highlights potential drawbacks, explains trade-offs, and provides source links for further research.

> Verdicts are AI-generated research summaries. They may contain errors, and source links do not independently verify every generated statement. Confirm important claims before purchasing.

## Features

| Feature | Description |
|---|---|
| **Product verdicts** | Generate research summaries for individual products |
| **Product comparisons** | Compare alternatives and their potential trade-offs |
| **Anonymous access** | Use the first 10 reviews without signing in |
| **User accounts** | Sign in securely through Clerk |
| **Paid plans** | Support WhatsApp-assisted purchases and administrator plan activation |
| **Persistent quotas** | Store and enforce review allowances using PostgreSQL |
| **xAI integration** | Generate verdicts through the server-side xAI API |
| **Source links** | Open references for additional research |
| **Responsive interface** | Access the platform on desktop and mobile |
| **Vercel deployment** | Host the frontend and API together in one project |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS |
| Backend | Express, TypeScript |
| Database | PostgreSQL |
| Database tooling | Drizzle ORM |
| Authentication | Clerk |
| AI provider | xAI |
| Package manager | pnpm |
| Application hosting | Vercel |

## Project Structure

```text
truthrouter-ai/
├── api/
│   ├── index.ts                 # API entrypoint
│   └── [...path].ts             # Catch-all API entrypoint
├── artifacts/
│   ├── api-server/              # Express backend
│   └── truthrouter-web/         # React frontend
├── lib/                         # Shared libraries and database schema
├── .env.vercel.example          # Environment variable template
├── .gitignore
├── .npmrc
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── tsconfig.json
├── vercel.json                  # Build and routing configuration
└── VERCEL_DEPLOYMENT.md          # Detailed deployment guide
```

## Getting Started

### Requirements

- A supported Node.js version compatible with Vite 7
- pnpm
- A PostgreSQL database accessible from Vercel
- A Clerk application that you own
- An xAI API key

### Install dependencies

From the repository root:

```bash
pnpm install --frozen-lockfile
```

Use pnpm rather than npm or Yarn.

## Environment Variables

Configure these variables in your Vercel project settings:

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Stable secret for signing anonymous-access cookies |
| `XAI_API_KEY` | Yes | Server-side xAI API key |
| `VITE_CLERK_PUBLISHABLE_KEY` | Yes | Browser-side Clerk publishable key |
| `CLERK_PUBLISHABLE_KEY` | Yes | Server-side Clerk publishable key |
| `CLERK_SECRET_KEY` | Yes | Server-side Clerk secret key |
| `ADMIN_USER_IDS` | Optional | Administrator user-ID allowlist |
| `ADMIN_EMAILS` | Optional | Administrator email allowlist |

See [`.env.vercel.example`](./.env.vercel.example) for the configuration template.

### Security notes

- Never commit actual credentials to GitHub.
- Keep database credentials, xAI keys, and Clerk secret keys server-side.
- Only intentionally public browser configuration should use the `VITE_` prefix.
- Use a securely generated `SESSION_SECRET` and keep it stable.
- Use your own Clerk application's production keys for production.
- Configure your deployment domains and redirect settings in Clerk.

Vercel automatically enables the application's external Clerk authentication mode.

## Database Setup

Provision PostgreSQL and use a pooled connection URL when available.

Before running schema commands, securely set `DATABASE_URL` and confirm that it points to the intended database.

Apply the application schema:

```bash
pnpm --filter @workspace/db run push
```

Review any proposed schema changes before accepting them.

> Database initialization is not performed automatically during a Vercel build or API startup. The source package does not include database records or subscription data.

## Deploy to Vercel

### 1. Upload to GitHub

If using the downloadable ZIP:

1. Extract the ZIP.
2. Open the `truthrouter-vercel` folder.
3. Upload the folder's **contents** to your GitHub repository.

`package.json` and `vercel.json` must be at the repository root.

Do not upload only the ZIP file or place the application inside an unnecessary extra folder.

### 2. Import the repository

In Vercel:

1. Create a new project.
2. Import your GitHub repository.
3. Leave **Root Directory** at the repository root.
4. Use the included `vercel.json` configuration.

The configured build command is:

```bash
pnpm run build:vercel
```

The frontend output directory is:

```text
artifacts/truthrouter-web/dist/public
```

### 3. Configure services

Before deploying:

- Add the required environment variables.
- Initialize the PostgreSQL schema.
- Configure Clerk for the deployment domain.

The frontend and Express API run in one Vercel project. PostgreSQL, Clerk, and xAI remain external services; no separate application server is required.

### 4. Verify the deployment

After deployment, check:

- Homepage and review routes
- Anonymous review generation
- Sign-in and sign-out
- Account quota display
- Administrator plan activation
- Verdict generation and source links

See [`VERCEL_DEPLOYMENT.md`](./VERCEL_DEPLOYMENT.md) for additional details.

## How It Works

1. The user submits a product or comparison query.
2. The API determines whether the request is anonymous or authenticated.
3. The applicable review allowance is checked and usage is reserved.
4. The server requests a verdict from xAI.
5. The frontend displays the result and available source links.
6. Reserved usage is released if verdict generation fails.

Paid-plan access is managed through the application's subscription and administrator activation workflow.

## Account Migration

Clerk user IDs identify accounts in the Vercel authentication mode.

Accounts and subscriptions associated with a previous authentication system are **not automatically linked** to new Clerk accounts. Any migration must be planned separately.

## Disclaimer

TruthRouter AI provides informational product research, not a guarantee of product quality, reliability, or suitability.

Before buying, confirm:

- Current pricing and availability
- Warranty and return policies
- Regional model differences
- Important reliability and safety claims

AI-generated verdicts can be incomplete, outdated, or incorrect.

## Author

<div align="center">

<img alt="Author" src="https://img.shields.io/badge/Author-Rabeea_Naseer-0E1420?style=for-the-badge">

<p><strong>Rabeea Naseer</strong></p>

<p>
<a href="https://github.com/rabeeanaseer">
<img alt="GitHub" src="https://img.shields.io/badge/GitHub-rabeeanaseer-181717?style=flat-square&logo=github&logoColor=white">
</a>
<a href="https://www.linkedin.com/in/rabeea-naseer-045b4a337/">
<img alt="LinkedIn" src="https://img.shields.io/badge/LinkedIn-Rabeea_Naseer-0A66C2?style=flat-square&logo=linkedin&logoColor=white">
</a>
</p>

<p>A product of <strong>Novatratech SMC Private Limited</strong></p>

</div>
````
