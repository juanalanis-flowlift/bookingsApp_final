# FlowLift - Multi-tenant Booking SaaS Platform

## Overview
FlowLift is a multi-tenant booking SaaS platform for small service businesses. It allows business owners to manage their services, availability, and bookings through a dashboard, while providing customers with public booking pages.

## Tech Stack
- **Frontend**: React 18, Vite, TailwindCSS, shadcn/ui, Wouter (routing), TanStack Query
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect)
- **Font**: Inter

## Project Structure
```
├── client/src/
│   ├── components/       # Reusable UI components
│   │   ├── ui/          # shadcn components
│   │   ├── AppSidebar.tsx
│   │   ├── ThemeProvider.tsx
│   │   └── ThemeToggle.tsx
│   ├── hooks/           # Custom React hooks
│   │   └── useAuth.ts
│   ├── lib/             # Utilities
│   │   ├── queryClient.ts
│   │   └── authUtils.ts
│   └── pages/           # Page components
│       ├── landing.tsx  # Public landing page
│       ├── dashboard.tsx
│       ├── services.tsx
│       ├── bookings.tsx
│       ├── availability.tsx
│       ├── settings.tsx
│       └── booking.tsx  # Public booking page
├── server/
│   ├── index.ts         # Express server entry
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Database storage layer
│   ├── replitAuth.ts    # Replit Auth integration
│   ├── db.ts            # Database connection
│   └── seed.ts          # Demo data seeding
└── shared/
    └── schema.ts        # Drizzle schema & types
```

## Database Schema
- **users**: User accounts (Replit Auth)
- **businesses**: Business profiles with slug for public URLs
- **services**: Services offered by businesses
- **availability**: Working hours per day of week
- **blocked_times**: Time off periods
- **bookings**: Customer appointments

## Key Features
1. **Multi-tenant Architecture**: Each user can own one business with unique slug
2. **Business Dashboard**: Manage services, view bookings, set availability
3. **Public Booking Page**: `/book/:slug` - customers can book appointments
4. **Double-booking Prevention**: Server-side validation for time conflicts
5. **Dark Mode Support**: Toggle between light/dark themes

## API Routes
### Protected (requires auth)
- `GET/POST/PATCH /api/business` - Business CRUD
- `GET/POST/PATCH/DELETE /api/services/:id` - Services CRUD
- `GET/POST /api/availability` - Availability management
- `GET/POST/DELETE /api/blocked-times/:id` - Blocked time management
- `GET/PATCH /api/bookings/:id` - Booking management

### Public
- `GET /api/public/business/:slug` - Get business by slug
- `GET /api/public/services/:slug` - Get active services
- `GET /api/public/availability/:slug` - Get availability
- `GET /api/public/bookings/:slug` - Get bookings for date
- `POST /api/public/bookings/:slug` - Create booking

## Demo Data
Three demo businesses are seeded:
1. **Classic Cuts Barbershop** (`/book/classic-cuts`) - Barber services
2. **Luxe Hair Studio** (`/book/luxe-hair`) - Hair salon services
3. **Bounce Party Rentals** (`/book/bounce-party`) - Inflatable rentals

## Development Commands
- `npm run dev` - Start development server
- `npm run db:push` - Push schema to database
- `npx tsx server/seed.ts` - Seed demo data

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key
- `ISSUER_URL` - Replit Auth issuer (default: https://replit.com/oidc)

## Design Decisions
- Using blue primary color (217 91% 60%) for professional SaaS look
- Inter font family for clean, modern typography
- Sidebar navigation for dashboard pages
- Card-based UI for services and bookings
- Calendar + time slot picker for booking flow
