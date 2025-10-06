# Clock In Portal

A modern timekeeping application for managing worker shifts with geolocation-based clock-in/out functionality.

## Tech Stack

- **Next.js 15** - React framework with App Router and Server Actions
- **TypeScript** - Type-safe development
- **Supabase** - Authentication and PostgreSQL database
- **Tailwind CSS** - Styling with dark theme
- **shadcn/ui** - UI component library
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
- Node.js 18+
- A Supabase account and project

### Installation

1. **Clone and install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   
   Create a `.env.local` file with your Supabase credentials:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

3. **Run the database schema**
   
   Execute the SQL in `supabase/schema.sql` in your Supabase SQL Editor to create all required tables.

4. **Create an admin user**
   ```bash
   node scripts/create-admin.js
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the app**
   
   Open [http://localhost:3000](http://localhost:3000)

## Admin Credentials

**Email:** erlin.hx@gmail.com  
**Password:** erlin123

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
│   │   ├── auth-client.ts      # Client-side auth functions
│   │   ├── session.ts          # Session management
│   │   ├── data.ts             # Data fetching
│   │   └── geo.ts              # Geolocation utilities
│   └── server/actions/         # Server Actions for data mutations
├── supabase/
│   └── schema.sql              # Database schema
└── scripts/                    # Utility scripts
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `node scripts/create-admin.js` - Create/update admin user
- `node scripts/run-schema.js` - Apply database schema

## License

MIT