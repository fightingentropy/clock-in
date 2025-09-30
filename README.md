# Clock-In System

A modern, location-based employee time tracking application built with Next.js, featuring real-time geolocation verification and role-based access control.

## 🚀 Features

### For Workers
- **Location-based clocking**: Clock in/out only when within designated workplace radius
- **Real-time location tracking**: GPS verification ensures accurate attendance
- **Multi-workplace support**: Switch between assigned workplaces
- **Live shift duration**: Real-time display of current shift time
- **Recent activity history**: View past clock-in/out records
- **Progressive Web App**: Install as a mobile app for easy access

### For Administrators
- **Real-time dashboard**: Monitor active workers and recent shifts
- **Worker management**: Add, edit, and assign workers to workplaces
- **Workplace management**: Create and configure workplace locations with custom radius
- **Time entry oversight**: View detailed shift reports and worker activity
- **Role-based access**: Secure admin controls with authentication

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js with bcrypt password hashing
- **UI Components**: Radix UI with Tailwind CSS
- **Location Services**: Browser Geolocation API
- **Deployment**: Optimized for Vercel deployment
- **Package Manager**: Bun (recommended)

## 📋 Prerequisites

- Node.js 18+ or Bun
- Git

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd clock-in
   ```

2. **Install dependencies**
   ```bash
   bun install
   # or
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure the following variables:
   ```env
   # Database
   TURSO_DATABASE_URL="file:./dev.db"
   
   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key"
   
   # Optional: For production deployment
   DATABASE_URL="your-production-database-url"
   ```

4. **Set up the database**
   ```bash
   bun run db:migrate
   bun run db:seed
   ```

5. **Start the development server**
   ```bash
   bun run dev
   # or
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 👥 Default Accounts

After running the seed script, you'll have these default accounts:

### Admin Account
- **Email**: admin@example.com
- **Password**: admin123
- **Role**: Administrator

### Worker Account
- **Email**: worker@example.com
- **Password**: worker123
- **Role**: Worker

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (admin)/           # Admin-only routes
│   ├── (auth)/            # Authentication pages
│   ├── (worker)/          # Worker dashboard
│   └── api/               # API routes
├── components/            # React components
│   ├── admin/            # Admin-specific components
│   ├── worker/           # Worker-specific components
│   └── ui/               # Reusable UI components
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
└── types/                # TypeScript type definitions

prisma/
├── schema.prisma         # Database schema
├── migrations/           # Database migrations
└── seed.ts              # Database seeding script
```

## 🗄️ Database Schema

The application uses the following main entities:

- **User**: Workers and administrators with role-based access
- **Workplace**: Physical locations with GPS coordinates and radius
- **Assignment**: Links workers to specific workplaces
- **TimeEntry**: Clock-in/out records with location data

## 🔧 Available Scripts

```bash
# Development
bun run dev              # Start development server
bun run build            # Build for production
bun run start            # Start production server
bun run lint             # Run ESLint

# Database
bun run db:migrate       # Run database migrations
bun run db:seed          # Seed database with sample data
bun run db:reset         # Reset database (destructive)
```

## 🌍 Location Features

### Geolocation Requirements
- Workers must be within the configured radius (default: 50 meters) to clock in/out
- Real-time GPS tracking with accuracy indicators
- Location data is stored for audit purposes
- Works on mobile devices and desktop browsers with location access

### Workplace Configuration
- Set custom radius for each workplace (in meters)
- Configure GPS coordinates for workplace center
- Optional address field for reference
- Multiple workplaces per worker support

## 🔐 Security Features

- **Password hashing**: bcrypt for secure password storage
- **Session management**: NextAuth.js with secure sessions
- **Role-based access**: Admin and Worker roles with different permissions
- **API protection**: Authenticated endpoints with role verification
- **Location validation**: Server-side verification of clock-in/out locations

## 📱 Progressive Web App

The application is configured as a PWA with:
- Service worker for offline functionality
- App manifest for mobile installation
- Responsive design for mobile and desktop
- Install prompts for mobile devices

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production
```env
DATABASE_URL="your-production-database-url"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-production-secret"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the authentication setup guide in `docs/auth-review.md`

## 🔄 Version History

- **v0.1.0**: Initial release with core clock-in/out functionality
  - Location-based verification
  - Admin and worker dashboards
  - Multi-workplace support
  - PWA capabilities
