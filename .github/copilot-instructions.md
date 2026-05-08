## FeedbackFlow — AI developer instructions

Quick summary
- Dual-application repo: a Next.js dashboard/API (pages router under `src/pages/`) and a separately-built embeddable widget (`src/widget/`) that outputs a UMD bundle to `public/widget/index.js`.

When to run first (fast path)
- Local app (Next dev server): `npm run dev`
- Build widget (required before testing the embed): `npm run build:widget` (uses `webpack.config.js` + `tsconfig.widget.json`)
- Production build: `npm run build` then `npm run start`
- DB seed: `npm run prisma:seed` (see `prisma/seed.ts`)

Big picture & why it’s organized this way
- Main app: full React/Next UI, server-side API routes, auth and RBAC. Inspect `src/pages/` for UI and `src/pages/api/` for endpoints.
- Widget: small standalone bundle intended to be embedded in client sites. Keeping it separate lets teams ship the widget independently and avoid bundling the whole app into the customer site.

Key files & integration points (use these as your navigation map)
- Auth & session: API routes use `getServerSession(req, res, authOptions)` — see typical usage in `src/pages/api/*` and `src/lib/auth`.
- RBAC: `src/lib/rbac.ts` — always call this before returning protected data.
- Prisma: `prisma/schema.prisma` and `src/lib/prisma.ts` (DB client). Migrations live under `prisma/migrations`.
- Event logging: `src/lib/event-logger.ts` — used across API handlers to record actions and audits.
- Widget entry: `src/widget/index.tsx`; build pipeline in `webpack.config.js`; widget config in `tsconfig.widget.json`. Output: `public/widget/index.js` (UMD).
- Middleware: `middleware.ts` performs request anonymization (IP masking) — be cautious when modifying.

Conventions and patterns to follow
- API handlers: authenticate via `getServerSession`, authorize via `src/lib/rbac.ts`, then call `src/lib/event-logger.ts` to record significant events.
- Widget auth: uses short-lived `memberToken` for test groups. Token handling and validation logic lives near widget/server endpoints.
- Seeding & migrations: prefer `scripts/safe-migrate` or `npm run prisma:seed` flows instead of manual SQL; look at `scripts/` for helpers.
- Tests: Jest is configured (`jest.config.js`, `jest.setup.js`). Unit tests use React Testing Library conventions.

Developer workflows / tips
- If you change widget TSX or styles: run `npm run build:widget` and open `public/demo-sample.html` or `public/pin-test.html` to smoke-test the embed.
- If you change API shape or DB schema: add a migration (`prisma migrate` or `scripts/safe-migrate`), run the migration, then `npm run prisma:seed` if you need test data.
- For a quick local production-like test: `npm run build` then `npm run start`.

Common gotchas (concrete examples)
- Forgetting to build the widget: the hosted demo and `public/widget/index.js` won’t reflect your changes.
- Middleware anonymization: tests that expect IP or geo metadata may fail because `middleware.ts` masks IPs.
- EventLog uses flexible JSON metadata — queries that assume a fixed shape may break (see `prisma/schema.prisma`).

Where to look for troubleshooting
- `scripts/` contains backups, maintenance, and verification helpers (PowerShell variants exist for Windows).
- `public/widget/index.js.LICENSE.txt` may be created by bundler; ignore for functionality.

When in doubt, open these files first:
- `src/lib/prisma.ts`, `prisma/schema.prisma` (DB)
- `src/lib/event-logger.ts` (audit behavior)
- `src/lib/rbac.ts` (authorization rules)
- `src/widget/index.tsx`, `webpack.config.js`, `tsconfig.widget.json` (widget build)
- `middleware.ts` (request anonymization)

If anything here is unclear or you need deeper examples (small code snippets showing the API -> RBAC -> event-log pattern, or the widget build entry), tell me which section and I will expand with examples from the codebase.
