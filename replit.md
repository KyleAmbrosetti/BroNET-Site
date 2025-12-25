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
- Pages: Home, Plans, Coverage, Support, Auth, Dashboard, Admin, SignupWizard
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
- `service_qualifications` - NBN service qualification results with LOC ID, CSA ID
- `service_orders` - Customer service orders with NBN identifiers and status
- `order_status_history` - Audit trail for order status changes

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

### NBN Service Qualification
The coverage checker uses a multi-source fallback system:
1. **RapidAPI NBN** (primary) - Real-time NBN address lookup via RapidAPI
2. **Admin Dataset** - Pre-loaded coverage data for known addresses
3. **NBN Public API** - Direct NBN Co API (may be blocked from server)
4. **Address Only** - Fallback mode with address validation only

The RapidAPI integration returns:
- Technology type (FTTP, FTTB, FTTC, HFC, Wireless, Satellite)
- Maximum available speed tier
- Service availability status

### NBN Service Order System
The application includes a complete NBN service order system:

**Multi-Step Signup Wizard** (`/signup`):
1. Address - Enter and verify service address with NBN coverage check
2. Qualification - Perform formal service qualification (generates LOC ID, CSA ID, SQ Reference)
3. Details - Enter contact information
4. Plan - Select internet plan based on available technology/speeds
5. Payment - Review order and pay via Stripe checkout
6. Confirmation - Display order reference and NBN identifiers

**NBN Identifiers**:
- LOC ID (Location ID) - Unique NBN location identifier
- CSA ID (Connectivity Serving Area) - NBN network area
- AVC ID (Access Virtual Circuit) - Assigned when service is active
- CVC ID (Connectivity Virtual Circuit) - Network connection ID
- SQ Reference - Service qualification reference number

**Service Order Flow**:
pending → submitted → in_progress → provisioning → active

**NBN Service Abstraction** (`server/nbnService.ts`):
- Currently uses simulated responses by default
- Supports multiple wholesale provider integrations
- Automatic fallback to simulated mode on API errors

### Aussie Broadband Nitrogen Integration (Primary)
The application integrates with Aussie Broadband's Nitrogen platform for wholesale NBN operations:
- **Client**: `server/nitrogenClient.ts` - REST API with token authentication
- **Capabilities**: Location search, service qualification, order creation, appointment management
- **Webhooks**: `/api/webhooks/nitrogen` endpoint for async order status updates
- **Features**: Auto/manual appointment booking, infrastructure upgrades, service configuration

### Superloop Connect API Integration (Secondary)
The application also supports Superloop's Connect API:
- **Client**: `server/superloopClient.ts` - OAuth 2.0 JWT authentication
- **Capabilities**: Location search, service qualification, order creation, appointment booking

**Priority Order for NBN Operations:**
1. Aussie Broadband Nitrogen (if configured)
2. Superloop Connect API (if configured)
3. Legacy NBN RSP API (if configured)
4. Simulated responses (default)

### Multi-Step Signup Wizard Flow
1. Address - Enter and verify service address
2. Qualification - NBN service qualification
3. Details - Contact information
4. Plan - Select internet plan
5. Account - Create account or login (inline)
6. Payment - Stripe checkout with card or BECS direct debit
7. Confirmation - Order reference and NBN identifiers

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Secret key for session encryption (defaults to development value)
- `RAPIDAPI_NBN_KEY` - RapidAPI key for NBN address lookup (nbnco-address-check API)
- `STRIPE_SECRET_KEY` - Stripe secret key for payment processing
- `NBN_RSP_API_KEY` - (Optional) Legacy NBN RSP API key

### Aussie Broadband Nitrogen Credentials (Optional)
- `NITROGEN_API_KEY` - Nitrogen API key from Aussie Broadband partner portal
- `NITROGEN_API_SECRET` - Nitrogen API secret
- `NITROGEN_TENANT_ID` - Your tenant ID in the Nitrogen platform
- `NITROGEN_USE_SANDBOX` - Set to 'true' for sandbox environment
- `NITROGEN_WEBHOOK_SECRET` - Secret for verifying webhook signatures

### Superloop Connect Credentials (Optional)
- `SUPERLOOP_CLIENT_ID` - Superloop API client ID
- `SUPERLOOP_PRIVATE_KEY` - RSA private key for JWT signing (PEM format)
- `SUPERLOOP_USE_SANDBOX` - Set to 'true' for sandbox environment