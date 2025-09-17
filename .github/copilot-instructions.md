# FeedbackFlow AI Developer Instructions

## Project Overview
FeedbackFlow is a B2B feedback collection platform with an embeddable widget for client websites. It uses Next.js with PostgreSQL/Prisma, NextAuth, and role-based access control (RBAC).

## Architecture Patterns

### Dual App Structure
- **Main App**: Next.js pages router (`src/pages/`) for dashboard and API
- **Widget**: Standalone React component built with Webpack (`src/widget/`) for embedding

### Key Data Models (see `prisma/schema.prisma`)
- **TestGroup**: Domain-specific feedback collection groups
- **Pin**: Feedback points with coordinates and status tracking
- **EventLog**: System events and user actions logging
- **UserActivity**: Anonymized user session tracking

## Development Workflows

### Build Commands
```bash
npm run dev              # Next.js development server
npm run build:widget     # Webpack build for embeddable widget
npm run build            # Production Next.js build
npm run prisma:seed      # Database seeding
```

### Testing Strategy
- Jest configuration in `jest.config.js` with React Testing Library
- API endpoints in `src/pages/api/` follow REST patterns
- Test groups use mock data via `mock-[id].ts` API routes

## Project-Specific Conventions

### API Route Patterns
- Use `getServerSession(req, res, authOptions)` for authentication
- RBAC checks via `src/lib/rbac.ts` before data access
- Event logging through `src/lib/event-logger.ts` for audit trails

### Widget Integration
- Widget builds to `public/widget/index.js` as UMD module
- External React/ReactDOM dependencies for client integration
- Token-based authentication via `memberToken` for test groups

### Database Migrations
- Use zero-downtime patterns (see `docs/event-monitoring-system.md`)
- Index all foreign keys and timestamp fields for performance
- Event retention: 365 days (system), 90 days (authenticated users), 30 days (anonymous)

### Middleware & Security
- Request anonymization in `middleware.ts` for IP addresses
- Session management with secure cookie handling
- Domain validation for test group creation

## Essential File Locations

### Core Services
- `src/lib/prisma.ts` - Database client
- `src/lib/event-logger.ts` - Centralized logging
- `src/lib/rbac.ts` - Role-based access control
- `src/lib/email.ts` - Email notifications

### Widget System
- `src/widget/index.tsx` - Widget entry point
- `webpack.config.js` - Widget build configuration
- `tsconfig.widget.json` - Widget TypeScript config

### Infrastructure
- `scripts/` - Database backup, maintenance, and deployment scripts
- `docs/` - Comprehensive setup and monitoring guides
- `prisma/migrations/` - Database schema evolution

## Common Gotchas
- Widget requires separate build step before testing
- Test groups must have valid domain format for creation
- EventLog uses JSON fields for flexible metadata storage
- Windows-specific scripts in PowerShell for automation
