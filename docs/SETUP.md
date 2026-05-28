# Setup

Controme now runs as a repo-root Next.js 16 application on the Buildpad RAD
platform. The old FastAPI `backend/` and Vite `frontend/` scaffolds are no
longer part of the active app.

## Prerequisites

- Git
- Node.js 24 preferred
- pnpm 10+
- Access to the project's `.env.local` values for Supabase and Buildpad DaaS

Check local tools:

```bash
node --version
pnpm --version
git --version
```

## Install

```bash
git clone https://github.com/Aarontzk/Controme.git retas-siber-imut
cd retas-siber-imut
pnpm install
```

`.env.local` is gitignored and must contain the live project values:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_BUILDPAD_DAAS_URL=...
NEXT_PUBLIC_MICROSERVICE_URL_MAIN=...
```

Do not commit `.env.local` or MCP token files.

## Run Locally

```bash
pnpm dev
```

Default app URL: `http://localhost:3000`.

Vision PoC URL: `http://localhost:3000/poc/vision`.

## Verification

```bash
pnpm test
pnpm lint
pnpm tsc --noEmit
pnpm build
pnpm exec playwright test e2e/vision-poc.spec.ts
```

Playwright starts its own server on `127.0.0.1:3100`. Stop any existing process
on that port if Playwright reports the URL is already in use.

## Branch Strategy

- Work on short-lived feature branches or the shared `azka` branch when assigned.
- Use conventional commits.
- Run `git pull --rebase origin <branch>` before pushing.
- Do not force-push shared branches.

## Deployment

AWS Amplify builds from `main` using `amplify.yml`:

```bash
pnpm install
pnpm build
```

Production environment variables are managed through Buildpad/Amplify tooling,
not committed files.
