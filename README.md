# Comfort Companion

A mobile-only web app connecting **Seekers** (pay-per-minute text chat for
comfort/companionship) and **Mentors** (verified listeners who earn per
minute), per the PRD and design system docs.

## Status

- **Frontend:** fully built and clickable — every screen in the spec (seeker
  onboarding, home/discovery, mentor profile, wallet, live chat with running
  billing, post-session rating, saved mentors, mentor access-code claim,
  mentor dashboard, mentor profile editor).
- **Backend:** runs in **demo mode** by default — all data lives in
  `localStorage` via `src/lib/store.tsx`, so you can try every flow without a
  Supabase project. The schema, RLS policies, and Edge Functions in
  `supabase/` are written, deployable, and fully wired to the frontend
  (`src/lib/data/`) — set `NEXT_PUBLIC_DEMO_MODE=false` with real Supabase
  credentials to switch over. Sign-in and coin purchases are still
  intentionally mocked; see "What's still mocked on purpose" below.
- **Video calling:** real, via [Agora](https://www.agora.io). A seeker's
  video call rings the Saathi (polled via `call_poll`); the Saathi accepts on
  the partner dashboard and both join an Agora channel with tokens minted by
  the `agora_token` edge function. Audio calls are still simulated.

## Running it

You need [Node.js](https://nodejs.org) 18+ installed.

```bash
npm install
npm run dev
```

Open http://localhost:3000 — resize your browser to a phone width (or open
on an actual phone) since this is a mobile-only layout; on wider screens it
renders as a centered phone-sized frame rather than a responsive desktop
layout.

## Going from demo mode to a real backend

The frontend is now fully wired to call Supabase (`src/lib/data/backend.ts`,
`src/lib/data/mentors.ts`, `src/lib/store.tsx`) — flipping
`NEXT_PUBLIC_DEMO_MODE` is all that's needed on the code side. What's left is
deploying the actual project:

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Run the migrations in order (via `supabase db push`, or paste each into
   the SQL editor): `0001_init.sql` (core schema + RLS), `0002_functions.sql`
   (`apply_session_tick`, `increment_wallet_balance`), `0003_mentor_profile_fields.sql`
   (extends `mentor_profiles` with the fields the UI needs — photos, tagline,
   personal-details block, etc).
3. Deploy the Edge Functions in `supabase/functions/*` with `supabase
   functions deploy <name>`. Set `SUPABASE_SERVICE_ROLE_KEY` as a function
   secret (Project Settings → Edge Functions). Coin purchases use
   Razorpay: deploy `create_order` and `razorpay_webhook` and set the secrets
   `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET`.
   In the Razorpay dashboard, point a webhook for the `payment.captured`
   event at the `razorpay_webhook` function URL. Use test-mode keys first.
4. Copy `.env.local.example` to `.env.local`, fill in
   `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Project
   Settings → API), and set `NEXT_PUBLIC_DEMO_MODE=false`.
5. For your first few real mentors, insert rows directly into `profiles` +
   `mentor_profiles` via the Supabase table editor with
   `verification_status = 'approved'` — no admin UI needed yet, per the
   design doc.

### Video calling setup (Agora)

1. Create an Agora project with **App ID + App Certificate** enabled.
2. Apply `supabase/migrations/0008_seeker_accounts_and_calls.sql`.
3. Set secrets and deploy the new/changed functions:

```bash
supabase secrets set AGORA_APP_ID=... AGORA_APP_CERTIFICATE=...
supabase functions deploy seeker_auth call_poll call_respond agora_token set_session_topic start_session end_session get_account
```

### What's still mocked on purpose

- **Sign-in** is phone number + 4-digit PIN (`seeker_auth` edge function; the
  PIN is stored as a salted PBKDF2 hash, 5 wrong tries locks the account for
  15 minutes). There's no SMS/OTP step and no real Supabase Auth session, so every Edge Function takes the acting user's id as a plain
  parameter and runs with the service-role key (bypassing RLS) rather than
  reading `auth.uid()`. The client generates a random id per device on first
  use (`bootstrap_profile` function, wrapped by `ensureSeekerId()` in
  `src/lib/data/backend.ts`) and a matching **shadow** `auth.users` row
  (synthetic email, random password, never surfaced anywhere) so the
  `profiles.id` foreign key is satisfied. This is fine for a demo/pilot; swap
  in real phone-OTP auth before this handles real user data, and switch the
  Edge Functions to trust `auth.uid()` from the caller's JWT instead.
- **Coin purchases** open Razorpay Checkout (`create_order` makes the order,
  `razorpay_webhook` credits coins and the first-recharge bonus). Demo mode
  still just credits coins locally. Keep pack prices in sync between
  `src/lib/mock-data.ts` and `supabase/functions/_shared/packs.ts`.
- **Per-minute billing** calls a new `session_tick` Edge Function roughly
  every 6 seconds from the live session screen
  (`src/lib/useSessionBilling.ts`), rather than relying on `billing_tick`'s
  cron sweep — this deployment has no `pg_cron` schedule configured.
  `billing_tick` (same `apply_session_tick` RPC) is still the more robust
  production path once you set up a schedule (Database → Cron in the
  Supabase dashboard, hitting the function every 15–30s) as a safety net for
  sessions the client-side ticks miss (e.g. a closed tab).

## Project structure

```
src/app/                 Next.js App Router pages (one folder per screen)
src/components/          Shared UI (buttons, chips, mentor cards, nav)
src/lib/store.tsx        App state — demo-mode logic, or real backend calls
                         when NEXT_PUBLIC_DEMO_MODE=false (see below)
src/lib/data/backend.ts  Edge Function wrappers + the per-device shadow user id
src/lib/data/mentors.ts  Real-mode mentor browse list (reads mentor_profiles)
src/lib/mock-data.ts     Mock mentors + coin packs, styled per the design doc
src/lib/types.ts         Shared TypeScript types
supabase/migrations/     Schema + RLS policies + billing/wallet SQL functions
supabase/functions/      Edge Functions: billing, payments, mentor invites,
                         profile bootstrap/updates, account reads
```
