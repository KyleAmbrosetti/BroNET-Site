# BroNET - Australian NBN Internet Service Provider

## Overview

BroNET is a full-stack web application for an Australian NBN (National Broadband Network) internet service provider. The application allows customers to browse internet plans, check coverage availability, create accounts, manage subscriptions, submit support tickets, and view network status. It includes both a customer-facing website and an admin dashboard for incident management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, React Context for auth state
- **Styling**: Tailwind CSS v4 with shadcn/ui component library (New York style)
- **Theme**: next-themes for dark/light mode support
- **Build Tool**: Vite with custom plugins for Replit integration

The frontend follows a page-based architecture with shared components:
- Pages: Home, Plans, Coverage, Support, Auth, Dashboard, Admin
- Reusable UI components from shadcn/ui in `client/src/components/ui/`
- Custom hooks for authentication (`use-user`) and mobile detection (`use-mobile`)

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: express-session with connect-pg-simple for persistent sessions
- **API Design**: RESTful endpoints under `/api/` prefix

The server handles:
- User authentication (signup, login, logout, session management)
- Support ticket CRUD operations
- Network incident management
- Contact form submissions

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Migrations**: Drizzle Kit with `drizzle-kit push` command

Database tables:
- `users` - Customer accounts with plan associations
- `tickets` - Support tickets with status tracking
- `ticket_replies` - Threaded replies on tickets
- `incidents` - Network status incidents
- `contact_messages` - Public contact form submissions

### Authentication
- Session-based authentication stored in PostgreSQL
- Password hashing (implementation in storage layer)
- Admin flag on user accounts for privileged access
- Protected routes require valid session via middleware

### Build System
- Development: Vite dev server with HMR for frontend, tsx for backend
- Production: Custom build script using esbuild for server bundling, Vite for client
- Output: Combined `dist/` directory with server bundle and static assets

## External Dependencies

### Database
- PostgreSQL database (required, connection via `DATABASE_URL` environment variable)
- Drizzle ORM for type-safe database queries
- connect-pg-simple for session storage

### UI Components
- shadcn/ui component library built on Radix UI primitives
- Lucide React for icons
- Embla Carousel for carousel components
- cmdk for command palette functionality

### Core Libraries
- TanStack React Query for data fetching and caching
- react-hook-form with zod for form validation
- date-fns for date formatting
- class-variance-authority for component variants

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Secret key for session encryption (defaults to development value)