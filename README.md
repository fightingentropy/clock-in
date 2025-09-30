# Clock In HQ

A dark-themed progressive web app for location-aware timekeeping built with Next.js 15, Prisma, and shadcn/ui. Workers authenticate, share their live location, and clock in/out only when within a configurable radius of their assigned workplace. Admins manage workplaces, assignments, and monitor active shifts in real time.

> **Repository Status**: Clean slate with fresh git history - ready for development!

## Features

- 🔐 Credential-based auth with worker/admin roles (NextAuth + Prisma)
- 📍 Client geolocation with server-side distance checks (50 m default radius)
- 🕑 Worker dashboard showing live proximity status, active shift duration, and recent history
- 📊 Admin dashboard for workplace CRUD, worker assignment, and shift timelines
- 💾 SQLite storage via Prisma with seed data and RESTful app router endpoints
- 📱 Installable PWA (manifest + service worker) with offline fallbacks for key screens
- 🎨 Minimal dark UI using shadcn/ui components and sonner toasts

## Getting started

```bash
# Install dependencies
npm install

# Set up database
npm run db:migrate
npm run db:seed

# Start development server
npm run dev
```

> **Note**: This project uses `bun` as the preferred package manager. You can also use `bun install` and `bun run dev` instead of npm commands.

The default seed users are:

- Admin — `admin@example.com` / `admin123`
- Worker — `worker@example.com` / `worker123`

## Environment

Copy `.env.example` to `.env` (already provided for local SQLite). Update `NEXTAUTH_SECRET` with a strong random value before deploying (e.g. `openssl rand -base64 32`).

## Useful scripts

- `npm run dev` – start the Next.js dev server
- `npm run build` – production build (static + server components)
- `npm run lint` – ESLint
- `npm run db:migrate` – run Prisma migrations
- `npm run db:seed` – seed default data
- `npm run db:reset` – reset database and reapply migrations

> **Alternative**: Use `bun` commands for faster execution: `bun run dev`, `bun run build`, etc.

## Notes

- Location access is required for workers to clock in/out; the UI guides users if permission is missing.
- Service worker registration is skipped in development to ease debugging.
- Prisma uses `prisma/dev.db`; delete or reset via `npm run db:reset` to start fresh.

## Repository Information

- **Clean History**: Repository has been reset with a single clean commit
- **Single Branch**: Only `main` branch exists (all feature branches removed)
- **Ready for Development**: Fresh start with all current code preserved
- **Package Manager**: Optimized for `bun` but compatible with `npm`
