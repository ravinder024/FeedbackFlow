# FeedbackFlow - Agent Development Guide

This repo has two deliverables:
- Next.js dashboard + API (Pages Router): `src/pages/` and `src/pages/api/`
- Embeddable widget bundle (UMD): sources in `src/widget/`, built to `public/widget/index.js`

## Commands (Local)

### App
```bash
npm run dev      # Next dev server (runs predev: kills port 3000)
npm run build    # Production build
npm run start    # Run production server
```

### Widget
```bash
npm run build:widget   # Webpack build for widget (uses webpack.config.js + tsconfig.widget.json)
```

### Lint
```bash
npm run lint
```

### Tests (Jest)
```bash
npm test               # same as: npm run test
npm run test

# Run a single test file
npm test -- src/lib/__tests__/email.test.ts
npm test -- src/components/feedback/__tests__/CoordinateSystem.test.tsx

# Run tests matching a name/pattern
npm test -- -t "Pin persistence"

# Watch mode
npm run test:watch

# Coverage
npm test -- --coverage
```

### Database (Prisma)
```bash
npm run prisma:seed   # runs prisma/seed.ts via ts-node
```

## Code Style Guidelines

### Imports
Keep imports grouped and ordered:
```ts
// 1) React/Next
import React, { useEffect, useState } from 'react';
import type { NextApiRequest, NextApiResponse } from 'next';

// 2) Third-party
import { z } from 'zod';

// 3) Local (prefer @/*)
import { prisma } from '@/lib/prisma';
import { cn } from '@/lib/utils';
```

### TypeScript
- Strict mode is enabled (`tsconfig.json`). Avoid `any`, but it is allowed when needed.
- Prefer `unknown` + narrowing over `any` for external input.
- Unused variables: prefix with `_` (ESLint configured to allow this).

### Naming
- Components: `PascalCase` (e.g. `FeedbackCollector`)
- Files:
  - Components: `PascalCase.tsx`
  - Utilities/hooks: `kebab-case.ts`
- Variables/functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`

### Formatting
- Follow existing code style in the file you touch.
- Keep diffs small; avoid reformat-only edits.

### API Route Pattern (Auth -> RBAC -> Work -> Log)
For protected endpoints:
```ts
const session = await getServerSession(req, res, authOptions);
if (!session?.user) return res.status(401).json({ error: 'Unauthorized' });

// Authorize (RBAC)
// const ok = await rbac.canViewTestGroup(session.user.id, testGroupId);
// if (!ok) return res.status(403).json({ error: 'Forbidden' });

try {
  // main logic
} catch (error) {
  console.error('Handler failed:', error);
  return res.status(500).json({ error: 'Internal server error' });
}
```

### Error Handling
- API routes: return consistent JSON errors; log server-side with context.
- UI: store an `error` state (`string | null`) and surface a user-safe message.

### Event Logging
- Prefer `EventLogger.logEvent()` / `EventLogger.logUserActivity()` for auditing.
- Logging should not break the main flow (logger already catches and returns `null`).

## Cursor / Copilot Rules

- Cursor rules: no `.cursorrules` or `.cursor/rules/` found in this repo at time of writing.
- Copilot instructions (follow these): `.github/copilot-instructions.md`
  - Dual-app architecture (Next.js + separate widget bundle)
  - Key integration points: auth, RBAC, Prisma, event logging, middleware

## Safety / Hygiene for Agents
- Do not commit unless the user explicitly asks.
- Do not change git config.
- Avoid destructive git commands (`reset --hard`, force pushes) unless explicitly requested.
- Don’t commit secrets (e.g. `.env`, credentials files).