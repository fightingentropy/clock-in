# Clock In

Clock In is a minimal dark-themed timekeeping dashboard built with Next.js, Better Auth, Supabase, and shadcn/ui. It supports two roles:

- **Admins** – manage workers, workplaces, assignments, and clock-ins/outs.
- **Workers** – clock themselves in and out based on live location and review their history.

## Stack

- Next.js App Router (TypeScript)
- Better Auth for password authentication
- Supabase Postgres for persistence
- shadcn/ui + Radix primitives for UI
- Tailwind CSS v4 (dark minimal theme)

## Features

- Email/password authentication via Better Auth with secure session cookies.
- Admin console to create workers, define workplaces (with latitude/longitude/radius), manage assignments, and manually clock workers.
- Worker dashboard that fetches geolocation to allow clocking in only inside the assigned workplace radius (default 50 m).
- Supabase-backed CRUD for workplaces, assignments, and time entries.
- Automatic profile bootstrap on first sign-in to keep Better Auth and Supabase in sync.

## Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   Copy `.env.example` to `.env.local` and fill out values:

   - `DATABASE_URL`: Supabase Postgres connection string (service role with `?pgbouncer=false` if you use pooled connection).
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`: Project API keys from Supabase dashboard.
   - `BETTER_AUTH_SECRET`: Random 32+ character secret.
   - `NEXT_PUBLIC_APP_URL`: e.g. `http://localhost:3000` during development.

3. **Apply database schema**

   Run the SQL in `supabase/schema.sql` against your Supabase database (via the SQL editor or CLI) to provision `user_profiles`, `workplaces`, `worker_assignments`, and `time_entries` tables plus helpers.

4. **Run Better Auth migrations**

   ```bash
   npm run auth:migrate
   ```

   This creates the tables Better Auth needs inside Supabase.

5. **Start the dev server**

   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000`.

## Usage notes

- The first user you create (via signup or manual DB insert) should be marked as `admin` in `user_profiles` to unlock the admin console. Admin forms provision new users using Better Auth and automatically create the linked profile row.
- Worker clock-in uses the browser Geolocation API. Browsers require HTTPS in production; for local dev use `http://localhost` which is allowed.
- The location check uses a haversine distance calculation (see `src/lib/geo.ts`). Adjust the default radius per workplace as needed.
- Manual clock adjustments are available to admins through the dashboard. All entries are stored in `time_entries` with metadata about who initiated the change.

## Scripts

- `npm run dev` – Start Next.js (Turbopack) in development.
- `npm run build` – Production build.
- `npm run start` – Run the built app.
- `npm run lint` – ESLint.
- `npm run auth:migrate` – Execute Better Auth migrations using the configured database.

## Folder structure highlights

```
src/
  app/
    api/auth/[...better-auth]/route.ts   ← Better Auth handler
    dashboard/                           ← Role-aware dashboard route
    layout.tsx, page.tsx                 ← Dark themed shell + login
  components/
    clock-controls.tsx                   ← Worker geolocation clock buttons
    dashboard/                           ← Admin/worker dashboards
    ui/                                  ← shadcn/ui primitives
  lib/
    auth.ts, auth-client.ts              ← Better Auth setup
    db.ts, session.ts, data.ts           ← DB helpers & session guards
    supabase.ts, geo.ts, types.ts        ← Supabase + helpers
  server/actions/                        ← Server actions for admins/workers
supabase/schema.sql                      ← Domain schema for Supabase
scripts/run-auth-migrations.ts           ← Better Auth migrations helper
```

## Next steps

- Add auditing & notifications for clock exceptions.
- Introduce metrics (hours worked per range) and export.
- Harden error handling & form validation on the client.

Enjoy building teams that clock in effortlessly! 🚀
