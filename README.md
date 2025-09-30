# Clock In HQ

A dark-themed progressive web app for location-aware timekeeping built with Next.js 15, Prisma, and shadcn/ui. Workers authenticate, share their live location, and clock in/out only when within a configurable radius of their assigned workplace. Admins manage workplaces, assignments, and monitor active shifts in real time.

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
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

The default seed users are:

- Admin — `admin@example.com` / `admin123`
- Worker — `worker@example.com` / `worker123`

## Environment

Copy `.env.example` to `.env` (already provided for local SQLite). Update `NEXTAUTH_SECRET` before deploying.

## Useful scripts

- `npm run dev` – start the Next.js dev server
- `npm run build` – production build (static + server components)
- `npm run lint` – ESLint
- `npm run db:migrate` – run Prisma migrations
- `npm run db:seed` – seed default data
- `npm run db:reset` – reset database and reapply migrations

## Notes

- Location access is required for workers to clock in/out; the UI guides users if permission is missing.
- Service worker registration is skipped in development to ease debugging.
- Prisma uses `prisma/dev.db`; delete or reset via `npm run db:reset` to start fresh.
