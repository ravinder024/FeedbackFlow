# FeedbackFlow

**Behavior-driven product issue detection system that converts user interaction signals into structured, actionable engineering insights.**

## 🎯 What is FeedbackFlow?

FeedbackFlow is **NOT** a survey tool, session replay system, or heatmap analytics platform.

Instead, it captures **real user interaction signals** such as:
- **Rage clicks** — repeated clicks indicating frustration
- **Dead clicks** — unresponsive interactions that fail silently
- **Navigation behavior** — how users move through workflows
- **Interaction sequences** — context around when things break

It transforms raw frontend behavior into **structured issues** with:
- ✅ Severity levels (high / medium / low)
- ✅ Reproducible steps
- ✅ Frequency metrics
- ✅ Contextual event history

---

## ❌ The Problem FeedbackFlow Solves

Traditional feedback systems rely on:
- 📸 Screenshots (incomplete context)
- 📝 Manual reporting (slow, vague)
- 🐌 Delayed QA cycles (reactive, not proactive)
- 📊 Generic analytics (noisy, unactionable)

**Most product issues are:**
- Contextual (happen in specific workflows)
- Workflow-driven (multi-step interactions)
- Interaction-based (not visible in heatmaps)

**Teams lack visibility into:**
- Where users struggle most
- Which interfaces feel broken
- Which workflows cause frustration
- Why users abandon features

**FeedbackFlow solves this** by automatically detecting friction from behavior signals.

---

## 👥 Who Is It Built For?

### Primary Users
- **Product Managers** — understand where products fail
- **QA Teams** — identify issues before production
- **Frontend Engineers** — debug real user workflows
- **UX Researchers** — validate design decisions
- **Startup Product Teams** — rapid iteration with signals

### Ideal Use Cases
- Internal product testing
- Beta testing & validation
- Usability testing
- Workflow debugging
- Friction analysis
- Feature rollout monitoring
- A/B testing validation

---

## 💡 Core Value Proposition

FeedbackFlow helps teams:

1. **Detect friction automatically** — no manual reporting
2. **Reduce bug report noise** — structured, deduped signals
3. **Capture user intent & context** — not just clicks
4. **Generate reproducible flows** — exact steps to reproduce
5. **Prioritize issues intelligently** — frequency + severity
6. **Identify workflow failures** — without recording video

---

## 🚀 Overview

**Built with:**
- Next.js 16.0.1 (Pages Router)
- TypeScript
- Prisma + PostgreSQL
- React Testing Library
- Jest

---

## 📋 Key Features

### Event Tracking
- **Click Tracking** — Records all user interactions with interactive elements
- **Rage Click Detection** — 3+ clicks in 300ms window = frustration signal
- **Dead Click Detection** — Click with no DOM response in 400ms = broken interaction
- **Navigation Tracking** — Page transitions for workflow context

### Context Engine
- **Session Tracking** — Group events by user session
- **Event Sequencing** — Maintain event history (max 10 rolling)
- **Previous-Event Context** — Capture what happened before the issue

### Issue Intelligence
- **Automatic Issue Generation** — Rage clicks & dead clicks → issues
- **Severity Assignment** — High (rage) / Medium (dead) / Low (regular)
- **Deduplication** — Same issue = frequency increment, not duplicate
- **Frequency Tracking** — How many times has this happened?
- **Reproducible Steps** — Human-readable steps-to-reproduce

### Data Persistence
- **In-Memory Issue Store** — Fast deduplication
- **Issue API** — `GET /api/issues` sorted by severity/frequency/timestamp
- **Event Logging** — Database audit trail for analysis

---

## 🏗️ How It Works

### High-Level Flow

```
User Interaction
  ↓
Signal Detection (click, navigate)
  ↓
Event Classification (regular click, rage, dead click)
  ↓
Context Engine (buffer previous events)
  ↓
Issue Builder (structure + deduplicate)
  ↓
Issue Store (in-memory + API)
  ↓
Moderator Dashboard (review & govern)
```

### Example: Dead Click Detection

**Raw Event:**
```json
{
  "type": "dead_click",
  "element": "button[data-testid='submit']",
  "page": "/checkout"
}
```

**Structured Issue (Generated Automatically):**
```json
{
  "issue_type": "Broken Interaction",
  "severity": "medium",
  "summary": "Interactive element not responding",
  "page": "/checkout",
  "element": "button[data-testid='submit']",
  "steps_to_reproduce": [
    "Navigate to /checkout",
    "Click on Submit button",
    "Nothing happens"
  ],
  "frequency": 5,
  "signature": "dead_click|/checkout|button[data-testid='submit']",
  "timestamp": "2026-05-09T15:30:00Z"
}
```

---

## 🧠 Design Philosophy

FeedbackFlow intentionally **avoids:**
- 📹 Heavy screenshot dependency (incomplete)
- 🎬 Invasive session recording (privacy, storage)
- 🔄 Complex replay systems (overhead)
- 📊 Noisy analytics dashboards (low signal)

Instead, it focuses on:
- 🎯 Lightweight signals (clicks, not videos)
- 💼 Actionable insights (not just data)
- 🔗 Contextual workflows (not isolated events)
- 🛠️ Engineering usability (not PM theater)

---

## 📊 Current Architecture

### Frontend
- **Next.js** — React framework with Pages Router
- **TypeScript** — Type safety
- **React Testing Library** — Component testing

### Backend
- **API Routes** — Lightweight Next.js endpoints
- **Prisma ORM** — Database abstraction

### Tracking Engine
- **Signal Classification** — Detect rage/dead clicks
- **Session Engine** — Group events by user
- **Context Builder** — Generate reproducible steps
- **Issue Store** — Deduplication & persistence
- **Event Buffer** — FIFO rolling window (max 10 events)

---

## 📁 Project Structure

```
FeedbackFlow/
├── src/
│   ├── components/tracking/
│   │   ├── ClickTracker.tsx            # Event detection
│   │   ├── NavigationTracker.tsx       # Navigation signals
│   │   └── SessionInitializer.tsx      # Session setup
│   ├── lib/tracking/
│   │   ├── context-builder.ts          # Issue generation
│   │   ├── issue-store.ts              # In-memory storage ✨
│   │   ├── event-buffer.ts             # FIFO buffer
│   │   ├── rage-click-detector.ts      # Rage detection
│   │   ├── dead-click-detector.ts      # Dead click detection
│   │   └── __tests__/
│   │       ├── context-builder.test.ts (43 tests)
│   │       └── issue-store.test.ts     (12 tests) ✨
│   ├── pages/api/
│   │   ├── events.ts                   # Event ingestion
│   │   ├── issues.ts                   # Issue retrieval ✨
│   │   └── events/sessions-affected.ts # Session aggregation
│   └── middleware.ts                   # IP anonymization
├── prisma/
│   ├── schema.prisma                   # Database schema
│   └── migrations/
├── docs/                               # Architecture & PRD
├── scripts/                            # DB utilities
└── README.md                           # This file

✨ = Recently added (v1.3.0)
```

---

## 🔑 Key APIs

### POST /api/events
Ingest tracking events (clicks, navigation, rage/dead clicks)

**Request:**
```json
{
  "type": "rage_click",
  "element": "button[data-testid='submit']",
  "page": "/checkout",
  "session_id": "session-abc",
  "previous_events": [
    { "type": "click", "element": "input", "page": "/checkout" }
  ]
}
```

### GET /api/issues ✨
Retrieve all generated issues (sorted by severity, frequency, timestamp)

**Query Parameters:**
- `sort`: `severity` | `frequency` | `timestamp`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "issue_type": "User Frustration",
      "severity": "high",
      "summary": "User repeatedly clicked on an unresponsive element",
      "page": "/checkout",
      "frequency": 5,
      "steps_to_reproduce": ["Navigate to /checkout", "Click submit"],
      "signature": "rage_click|/checkout|button.submit",
      "timestamp": "2026-05-09T15:30:00Z",
      "last_seen": "2026-05-09T15:35:22Z"
    }
  ],
  "count": 1
}
```

### GET /api/events/sessions-affected
Count distinct sessions for an issue signature

**Query:** `?signature=dead_click|/checkout|button.submit`

**Response:**
```json
{
  "sessions_affected": 42,
  "signature": "dead_click|/checkout|button.submit"
}
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL database

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local and set DATABASE_URL

# Run migrations
npm run prisma:migrate

# Seed sample data (optional)
npm run prisma:seed

# Start development server
npm run dev
```

The app runs on `http://localhost:3000`

---

## 📊 Testing

```bash
# Run all tests
npm test

# Specific test suites
npm test -- src/lib/tracking/__tests__/context-builder.test.ts  # 43 tests
npm test -- src/lib/tracking/__tests__/issue-store.test.ts      # 12 tests ✨

# Watch mode
npm run test:watch

# Coverage
npm test -- --coverage
```

**Test Coverage:**
- ✅ 43/43 context-builder tests passing
- ✅ 12/12 issue-store tests passing ✨
- ✅ 0 TypeScript errors
- ✅ Interactive filtering validation
- ✅ Deduplication logic
- ✅ Sorting & API contracts

---

## 🛠️ Development

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Run production server
npm run lint         # ESLint check
npm run build:widget # Build embeddable widget
```

---

## 📝 Current Status

### ✅ Implemented (v1.3.0)
- Event tracking engine (click, navigation)
- Rage click detection (3+ clicks in 300ms)
- Dead click detection (no response in 400ms)
- Session tracking
- Context generation (previous events)
- Issue structuring with severity
- **Issue persistence & deduplication** ✨
- **Issue API (`GET /api/issues`)** ✨
- **Interactive element filtering** ✨
- **In-memory issue store** ✨

### 🔄 In Progress
- Moderator dashboard
- Issue governance workflows
- Issue status management (new/open/resolved)
- Jira/Asana integration preparation

### 📋 Planned
- Jira integration layer
- AI-assisted issue summarization
- Smart issue clustering
- Workflow analytics
- Public widget SDK
- Custom detector plugins

---

## 🎨 Design Principles

- **Lightweight** — Minimal overhead, no bloat
- **Context-first** — Behavior is the data
- **Actionable** — Signals → Issues → Actions
- **Low-noise** — Deduplication, not dashboards
- **Developer-friendly** — Clean APIs, full TypeScript
- **PM-friendly** — Prioritized, structured signals
- **Privacy-conscious** — IP masking, no recordings

---

## ⚠️ Disclaimer

FeedbackFlow is currently an **experimental** product intelligence system under active iteration and is **not yet production hardened**.

It's suitable for:
- Internal testing
- Beta programs
- Experimental features
- Usability validation

Before deploying to production, consider:
- Load testing with expected traffic
- Data retention policies
- Privacy compliance (GDPR, CCPA)
- Jira/issue system integration

---

## 📚 Documentation

- [Architecture Overview](docs/02-architecture/overview.md)
- [Data Flow Diagram](docs/02-architecture/data-flow.md)
- [API Endpoints](docs/04-api/endpoints.md)
- [Event Monitoring System](docs/event-monitoring-system.md)
- [Moderator Dashboard PRD](docs/03-prd/v2/Moderator-dashboard.md)

---

## 🤝 Contributing

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes & ensure tests pass
npm test

# Commit with clear message
git commit -m "feat: add new capability"

# Push and create pull request
git push origin feature/your-feature
```

**Guidelines:**
- All new features need tests (Jest)
- TypeScript types required (no `any`)
- ESLint must pass
- Update docs if behavior changes

---

## 🐛 Troubleshooting

### Rage/Dead Clicks Not Detected
1. Ensure `ClickTracker.tsx` is mounted in your app layout
2. Verify `SessionInitializer.tsx` runs before tracking
3. Check browser console for debug logs (e.g., `✓ Generated Issue: User Frustration`)

### Issues Not Showing in `/api/issues`
1. Verify clicks trigger POST to `/api/events`
2. Check browser console for issue generation logs
3. Non-interactive elements are filtered out — only buttons, links, inputs, etc.

### Event Buffer Always Empty
1. Verify `pushEvent()` is called in ClickTracker
2. Buffer max size is 10 events (older events drop off)
3. Filter includes only 'click' and 'navigation' types

---

## 📄 License

MIT

---

## 🆘 Support

For issues, questions, or feature requests:
- Open a GitHub issue
- Contact the team
- Check [docs/](docs/) for detailed documentation

---

**Last Updated**: May 9, 2026 | **Version**: 1.3.0 | **Status**: Active Development ⚠️

---

## 🔗 Quick Links

- [GitHub Repo](https://github.com/your-username/FeedbackFlow)
- [Issue Tracking](https://github.com/your-username/FeedbackFlow/issues)
- [Architecture Docs](docs/02-architecture/)
- [API Reference](docs/04-api/endpoints.md)
