# System Architecture Overview

## 1. High-Level Architecture

The FeedbackFlow system is structured as a dual-application architecture:

```
Client (Browser) → Widget → API → Database
Main Dashboard → API → Database
```

- **Client (Browser):** End-users interact with the system via the embeddable widget or the main dashboard.
- **Widget:** A lightweight React-based component embedded in client websites via a script tag.
- **API:** Next.js API routes handle business logic, authentication, and data persistence.
- **Database:** PostgreSQL database managed via Prisma ORM.

---

## 2. Component Breakdown

### Frontend
- **Main Dashboard:** Built with Next.js (pages router) for managing test groups, pins, and analytics.
- **Widget:** A React-based embeddable component, bundled as a UMD module via Webpack.

### Backend
- **API Routes:** Next.js server-side API routes for handling requests from both the dashboard and widget.
- **Prisma ORM:** Interfaces with the PostgreSQL database for schema management and data access.

### Database
- **PostgreSQL:** Stores user data, test groups, pins, and event logs.
- **Prisma Schema:** Defines the database structure and relationships.

### Authentication
- **NextAuth:** Provides authentication using Google OAuth for the dashboard.
- **JWT Tokens:** Used for short-lived widget authentication.

---

## 3. Key Integrations

- **Widget Embedding:** The widget is injected into client websites via a script tag, loading the UMD bundle from `public/widget/index.js`.
- **JWT Authentication:** The widget uses short-lived `memberToken` JWTs for secure communication with the API.
- **Real-Time Updates:** WebSocket or polling mechanisms keep the dashboard and widget in sync.

---

## 4. Data Flow Overview

1. **User Authentication:**
    - Users log in via Google OAuth (NextAuth).
    - A session is created and stored securely.

2. **Widget Token Generation:**
    - Upon session creation, a short-lived `memberToken` is generated for widget authentication.

3. **Pin Creation:**
    - Users interact with the widget to create pins.
    - The widget captures DOM selectors and sends the data to the API.

4. **Observer View Sync:**
    - The API saves the pin data to the database.
    - Real-time updates are pushed to observers via WebSocket or polling.

---

## 5. Security Layers

- **Domain Validation:** Ensures widgets are only embedded in authorized domains for test groups.
- **RBAC Checks:** All API routes enforce role-based access control using `src/lib/rbac.ts`.
- **Request Anonymization:** Middleware masks sensitive data like IP addresses.
- **Event Logging:** All significant actions are recorded for audit trails using `src/lib/event-logger.ts`.

---

## Text-Based Diagram

```
[Browser]
    ↓
[Widget (React)]
    ↓
[API (Next.js)]
    ↓
[Database (PostgreSQL)]
```

- Main Dashboard follows a similar flow, bypassing the widget.
