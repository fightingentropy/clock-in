# Clock In Portal

A modern timekeeping application for managing worker shifts with geolocation-based clock-in/out functionality.

## Tech Stack

- **Next.js 15** - React framework with App Router and Server Actions
- **TypeScript** - Type-safe development
- **SQLite** - Lightweight relational database (via Bun's `bun:sqlite`)
- **Tailwind CSS** - Styling with dark theme
- **shadcn/ui** - UI component library
- **Bun** - Runtime and package manager
- **Bun password APIs** - Built-in password hashing and verification
- **Geolocation API** - Location-based clock-in validation

## How It Works

### Admin Features
- Create and manage worker accounts
- Define workplaces with GPS coordinates and radius
- Assign workers to specific workplaces
- Manually clock workers in/out
- View all time entries and worker status in real-time

### Worker Features
- Clock in/out using geolocation verification
- View assigned workplaces
- Track shift history and duration
- Update personal profile information

### Geolocation Verification
Workers can only clock in when physically within the defined radius of their assigned workplace. The app uses the browser's Geolocation API to verify the worker's location against workplace coordinates.

## Getting Started

### Prerequisites
- Bun 1.1+

### Installation

1. **Clone and install dependencies**
   ```bash
   bun install
   ```

2. **Set up environment variables (optional)**
  
  Create a `.env.local` file to override defaults:
  ```
  # Where the SQLite database file will be placed (defaults to ./sqlite/clock-in.sqlite)
  DATABASE_PATH=./sqlite/clock-in.sqlite

  # Optional admin bootstrap values used by create-admin script
  ADMIN_EMAIL=admin@clockin.local
  ADMIN_PASSWORD=admin123
  ADMIN_FULL_NAME=Admin User
  ```

3. **Run the database schema**
  ```bash
  bun run run-schema
  ```

4. **Create an admin user**
   ```bash
   bun run create-admin
   ```

5. **Start the development server**
   ```bash
   bun run dev
   ```

6. **Access the app**
   
   Open [http://localhost:3000](http://localhost:3000)

## Admin Credentials

**Email:** admin@clockin.local  
**Password:** admin123

Use these credentials to log in and access the admin dashboard.

## Database Schema

- **user_profiles** - User information and roles (admin/worker)
- **workplaces** - Location definitions with GPS coordinates
- **worker_assignments** - Links workers to workplaces
- **time_entries** - Clock-in/out records with timestamps

## Project Structure

```
clock-in/
├── src/
│   ├── app/                    # Next.js App Router pages
│   ├── components/             # React components
│   │   ├── dashboard/          # Admin and worker dashboards
│   │   └── ui/                 # shadcn/ui components
│   ├── lib/                    # Utilities and helpers
│   │   ├── db.ts               # SQLite connection helper
│   │   ├── session.ts          # Session + auth helpers
│   │   ├── data.ts             # Data fetching helpers
│   │   └── geo.ts              # Geolocation utilities
│   └── server/actions/         # Server Actions for data mutations
├── sqlite/
│   └── schema.sql              # SQLite schema
└── scripts/                    # Utility scripts
```

## Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run lint` - Run ESLint
- `bun run create-admin` - Create/update admin user
- `bun run delete-admin` - Remove the seeded admin user
- `bun run run-schema` - Apply database schema

## License

MIT


Email: admin@clockin.local
Password: admin123