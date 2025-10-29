# Proven Accountability Platform

Proven is a web3 accountability platform where people stake real value on healthy habits. Participants join challenges by staking USDC or SOL on Solana, submit daily proof for review, and receive rewards when they stay consistent. The project is split into a Next.js frontend, an Express/Prisma API, and an Anchor program that enforces the financial rules on-chain.

## Product Snapshot
- Habit challenges backed by on-chain stakes and prize pools.
- Supabase-backed authentication with Google OAuth, wallet connect, and session management.
- Daily proof capture with image uploads, admin review, and decisioning.
- Automated escrow wallet creation, transfer verification, and payouts on Solana.
- Developer-friendly tooling: seeded Postgres data, REST API docs, automated tests.

## Architecture Overview

```
┌───────────────────┐    HTTPS /api    ┌───────────────────────┐
│ Next.js Frontend  │◄────────────────►│ Express API (Node 20) │
│ - Supabase Auth   │                  │ - Prisma ORM          │
│ - Solana wallets  │                  │ - Supabase service API│
│ - Challenge UI    │                  │ - Rate limiting & CORS│
└──────────┬────────┘                  └───────────┬───────────┘
           │ Supabase user/session JWTs            │
           │ Proof uploads (Supabase Storage)      │
           ▼                                        ▼
┌───────────────────┐        Prisma ORM        ┌───────────────┐
│ Supabase Auth &   │◄────────────────────────►│ Postgres DB   │
│ Storage (proofs)  │                           │ (Challenges, │
└───────────────────┘                           │ Users, etc.) │
                                                └─────┬────────┘
                                                      │
                                                      │ Anchor client
                                                      ▼
                                           ┌────────────────────────┐
                                           │ Solana Proven Program  │
                                           │ - PDA escrows          │
                                           │ - Challenge lifecycle  │
                                           │ - Payout settlement    │
                                           └────────────────────────┘
```

### Service Responsibilities
- **`proven-frontend/`** – Next.js 15 + React 19 app with Tailwind UI, Solana wallet adapters, Supabase client, and dashboards for challengers and admins.
- **`proven-backend/`** – TypeScript Express API with Prisma ORM, Supabase service role integration, rate limiting, Supabase Storage proxy, transaction/faucet utilities, and cron-friendly services (challenge completion, escrow management).
- **`proven-program/`** – Anchor/Solana program that creates and manages escrow PDAs, tracks challenge status, and exposes instructions such as `create_challenge`, `join_challenge`, `record_proof`, and `settle_challenge`.

### Data & Integrations
- **Database**: Postgres accessed through Prisma. Key models include `Challenge`, `User`, `UserChallenge`, `Submission`, `Transaction`, and `EscrowWallet`.
- **Auth & Storage**: Supabase handles Google OAuth, session tokens, and the `proof-submission` storage bucket for uploaded evidence.
- **Blockchain**: Solana Devnet by default. The backend creates encrypted escrow keypairs per challenge and verifies USDC transfers before marking a stake as funded.
- **External Tooling**: Winston for structured logging, Helmet/Compression for API hardening, Jest for backend testing, Anchor’s test runner for on-chain logic.

## Repository Layout
- `proven-frontend/` – Next.js application (challenge dashboards, onboarding, admin tooling).
- `proven-backend/` – API gateway, business logic, Prisma schema, seed scripts, REST docs.
- `proven-program/` – Anchor workspace containing the Solana program and deployment config.
- `docs/` (under backend) – REST endpoint reference (`backend-api.md`).

## Core Workflows
**Challenge lifecycle**
1. Admin authenticates via Google/Supabase and creates a challenge from the dashboard.
2. Backend writes the challenge to Postgres, generates an encrypted escrow wallet, and (optionally) registers the challenge on-chain via the Anchor program.
3. Participants join from the frontend, connect a wallet, and stake USDC/SOL into the escrow. The backend verifies the transfer before marking enrollment.

**Daily proof submission**
1. Participant uploads photo evidence from the dashboard. Files are stored in Supabase Storage; metadata is persisted in Postgres.
2. Backend prevents duplicate submissions per day and records metadata (IP, user agent) for auditability.
3. Admins review submissions, updating their status and progress for each `UserChallenge`.

**Settlement & payouts**
1. After the challenge window closes, the backend (or an admin action) calls settlement services.
2. Anchor program computes winners/losers, updates PDA state, and releases rewards or refunds according to thresholds and platform fees.
3. Transactions are recorded in the `Transaction` table with Solana signatures for traceability.

## Getting Started

### Prerequisites
- Node.js 20.x and npm 10+ (frontend + backend).
- Rust toolchain with the Solana CLI and Anchor (`cargo install --git https://github.com/coral-xyz/anchor anchor-cli`).
- Postgres 14+ reachable at `DATABASE_URL`.
- Supabase project (URL, Anon key, Service Role key) with a `proof-submission` storage bucket.
- Solana keypair at `~/.config/solana/id.json` funded on Devnet for deployments.

### Quick Setup
1. Clone the repo and install dependencies for each workspace (`npm install`).
2. Copy the provided `.env.example` files to `.env` / `.env.local` and fill values.
3. Prepare Postgres (`npx prisma migrate deploy`) and seed sample data (`npm run prisma:seed`).
4. Start backend and frontend dev servers; optionally run the Anchor local validator for end-to-end tests.

### Backend API (`proven-backend`)
```bash
cd proven-backend
cp .env.example .env          # adjust secrets
npm install
npx prisma migrate deploy
npm run prisma:seed           # optional sample challenge + admin
npm run dev                   # starts http://localhost:3001
```
- REST endpoints mount under `/api` (see `docs/backend-api.md`).
- CORS origins default to localhost; set `CORS_ORIGINS` in production.
- Escrow private keys are encrypted with `ESCROW_ENCRYPTION_KEY` before storage.

### Frontend (`proven-frontend`)
```bash
cd proven-frontend
cp .env.example .env.local    # supply backend URLs, Supabase + Solana keys
npm install
npm run dev                   # starts http://localhost:3000
```
- Uses Supabase Auth for login; ensure the Supabase redirect URL matches the local origin.
- Connects to the backend via `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_SERVER_URL`.
- Solana wallets are handled via `@solana/wallet-adapter-*` packages; set `NEXT_PUBLIC_PROGRAM_ID`, `NEXT_PUBLIC_USDC_MINT`, and `NEXT_PUBLIC_ORACLE_PUBKEY`.

### Anchor Program (`proven-program`)
```bash
cd proven-program
anchor build
anchor test                   # spins up local validator
anchor deploy --provider.cluster devnet
```
- Update `declare_id!` and `Anchor.toml` after deploying.
- Propagate the new program ID to frontend and backend environment files.

### Database & Supabase Notes
- Prisma schema lives at `proven-backend/prisma/schema.prisma`; update and run `npx prisma migrate dev` during development.
- Seed script (`prisma/seed.ts`) creates a demo admin and sample challenge.
- Supabase requires a `proof-submission` storage bucket and configured RLS policies that allow the service role to write and the client to read via signed URLs.

## Environment Variables

**Backend essentials (`proven-backend/.env`)**
- `DATABASE_URL`, `DIRECT_URL` – Postgres connection strings.
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`.
- `JWT_SECRET`, `JWT_EXPIRES_IN` – API session signing.
- `ESCROW_ENCRYPTION_KEY` – 32-byte key for encrypting escrow secret keys.
- `SOLANA_RPC_URL`, `NETWORK`, `ESCROW_PUBKEY` – blockchain configuration.
- `ADMIN_EMAILS` – comma-separated admin whitelist.
- `CORS_ORIGINS`, `RATE_LIMIT_MAX_REQUESTS` – security hardening.

**Frontend essentials (`proven-frontend/.env.local`)**
- `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SERVER_URL` – backend endpoints.
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `NEXT_PUBLIC_PROGRAM_ID`, `NEXT_PUBLIC_USDC_MINT`, `NEXT_PUBLIC_ORACLE_PUBKEY`, `NEXT_PUBLIC_SOLANA_NETWORK`.
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_ADMIN_EMAILS`.

## Testing & Quality
- Backend unit/integration tests: `npm test`, `npm run test:watch`, `npm run test:coverage`.
- Prisma schema validation: `npx prisma format` and `npx prisma validate`.
- Frontend linting: `npm run lint`; TypeScript checks via `npm run check-types`.
- Anchor program tests: `anchor test` (runs against local validator).
- CI/CD recommendation: run backend tests + lint, frontend lint + build, Anchor build before deployment.

## Deployment Notes
- Backend is stateless; deploy via Node process manager or container. Ensure secrets are injected and database migrations run on release.
- Frontend builds to static assets served by Next.js (`next build && next start`) or Vercel.
- Anchor program deployments must be coordinated with environment variable updates and data migrations (e.g., mapping new program IDs to existing challenges).
- Supabase service role key is highly sensitive; store it only in server-side environments.
- Enable HTTPS for production origins and populate `CORS_ORIGINS` accordingly (e.g., `https://proven-frontend.vercel.app`).

## Additional Resources
- Backend REST reference: `proven-backend/docs/backend-api.md`
- Solana program README: `proven-program/README.md`
- Prisma data model: `proven-backend/prisma/schema.prisma`
- Sample seed data: `proven-backend/prisma/seed.ts`

Questions or improvements? Open an issue or start a discussion before shipping major changes to the on-chain program or database schema.
