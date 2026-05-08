# PRD: FeedbackFlow v2 — Event Tracking Engine

**Status**: ✅ Core Features Complete | ⏳ Session Tracking Active | 📋 Future Enhancements Planned

**Quick Links**: [Architecture](#architecture-overview) • [Modules](#tracking-modules) • [Status](#implementation-status) • [Design](#technical-design-details)

---

## Objective

Capture user interaction signals in real-time to detect friction points in the product experience. Detect rage clicks, dead clicks, track navigation, and correlate events into sessions.

---

## Architecture Overview

**In Scope**: Click tracking • Rage detection • Dead click detection • Navigation tracking • Session grouping • Real-time delivery

**Out of Scope**: AI processing • Issue clustering • Visualization • Dashboard analytics

### Core Event Types

| Type | Detection | Result |
|------|-----------|--------|
| `click` | Successful element interaction | Baseline engagement signal |
| `rage_click` | 3+ clicks in 1s on same element | UX friction indicator |
| `dead_click` | Click with no DOM response (400ms) | Unresponsive element detection |
| `navigation` | Page load or SPA route change | Session flow + funnel tracking |

### Event Data Model

```javascript
{
  id: string,           // CUID
  type: string,         // "click" | "rage_click" | "dead_click" | "navigation"
  element?: string,     // Stable element key (null for navigation)
  page: string,         // Full pathname + search + hash
  subtype?: string,     // "page_load" | "page_reload" | "route_change" (nav only)
  session_id?: string,  // UUID for grouping events into sessions
  timestamp: DateTime
}
```

---

## Tracking Modules
- **Status**: Production-ready with direct sends
- **Location**: [src/components/tracking/ClickTracker.tsx](../../src/components/tracking/ClickTracker.tsx)
- **Architecture**:
  - Global document-level click listener (capture phase)
  - Direct `sendEvent()` helper (no shared classifier)
  - Rage click: sent immediately + cancels any pending click timer
  - Interactive elements: 450ms deferred click (dead-click gets 400ms first)
  - Non-interactive elements: sent immediately (no dead-click check)
  - Exports `cancelPendingClick()` for NavigationTracker coordination

#### Rage Click Detection
- **Status**: Fully implemented with two-phase cooldown
- **Location**: [src/lib/tracking/rage-click-detector.ts](../../src/lib/tracking/rage-click-detector.ts)
- **Logic**:
  - Detects 3+ clicks in 1 second on same element
  - Phase 1 (1.5s): Hard suppression (no events recorded)
  - Phase 2 (2s): Recovery mode (only regular clicks allowed)
  - Total cooldown: 3.5s per element
  - Prevents click spam and cascading rage events

#### Dead Click Detection
- **Status**: Refined with stable keys and parent walkup
- **Location**: [src/lib/tracking/dead-click-detector.ts](../../src/lib/tracking/dead-click-detector.ts)
- **Features**:
  - Stable element identification (data-testid → id → position-based)
  - 2-3 level parent walkup for interactive ancestors
  - 400ms MutationObserver window for DOM response detection
  - 1.5s cooldown per stable key (prevents cascades)
  - Strict interactive element filtering (buttons, inputs, links only)
- **Result**: Only sends `dead_click` if element truly unresponsive

#### Navigation Tracking
- **Status**: Fully implemented with direct sends + click cancellation
- **Location**: [src/components/tracking/NavigationTracker.tsx](../../src/components/tracking/NavigationTracker.tsx)
- **Architecture**:
  - Detects initial page load (waits for `router.isReady`) → sends with subtype: `page_load`
  - Listens to `routeChangeStart` → calls `cancelPendingClick()` (suppresses buffered click)
  - Listens to `routeChangeComplete` → sends with subtype: `route_change`
  - Tracks `previousRouteRef` to prevent duplicate events for same route
  - Sends navigation events directly (no shared classifier)
- **Payload**: `{ type: "navigation", subtype: "page_load" | "route_change", page: "/path?query=value" }`

#### Cross-Tracker Coordination
- **Status**: Implemented via exported `cancelPendingClick()`
- **Location**: Exported from [ClickTracker.tsx](../../src/components/tracking/ClickTracker.tsx), called by [NavigationTracker.tsx](../../src/components/tracking/NavigationTracker.tsx)
- **How it works**:
  - ClickTracker buffers interactive clicks for 450ms (`pendingClickTimer`)
  - NavigationTracker calls `cancelPendingClick()` on `routeChangeStart`
  - This ensures: click on navigating link → ONLY navigation event sent
  - Dead-click callback also calls `cancelPendingClick()` → ONLY dead_click sent
  - Rage-click handler calls `cancelPendingClick()` → ONLY rage_click sent
- **Note**: EventClassifier (shared 400ms window) was DEPRECATED due to fundamental bugs
  - Shared window caused navigation to always win over clicks
  - See [event-classifier.ts](../../src/lib/tracking/event-classifier.ts) deprecation notice

#### Integration
- **Location**: [src/pages/_app.tsx](../../src/pages/_app.tsx)
- **Components Mounted**:
  - `<ClickTracker />` - Captures click/rage/dead events
  - `<NavigationTracker />` - Captures navigation events
- **Timing**: Both mount during React hydration (after SSR)
- **Performance**: No blocking operations, all tracking asynchronous

#### Backend API
- **Status**: Updated to support subtype field
- **Endpoint**: `POST /api/events`
- **Accepts**:
  - Single event: `{ type, subtype?, element?, page, timestamp? }`
  - Batch events: `{ events: [...] }`
- **Behavior**:
  - Validates non-empty `type` field
  - Element is now optional (for navigation events)
  - Subtype is optional (for navigation: "page_load", "route_change")
  - Server auto-generates timestamp if missing
  - Stores in `Event` table with all fields
  - Low-latency response (success confirmation)
- **Schema Changes**:
  - Added `subtype` column to `Event` model (optional String)
  - Migration: `20260408205149_add_event_subtype`

#### Event Payloads (Implemented)
```javascript
// Click event
{
  "type": "click",
  "element": "button[data-testid=\"submit\"]",
  "page": "/feedback/form"
}

// Rage click event (immediate, no dead detection)
{
  "type": "rage_click",
  "element": "button.submit-btn",
  "page": "/feedback/form"
}

// Dead click event (sent only if unresponsive)
{
  "type": "dead_click",
  "element": "a#nav-link",
  "page": "/dashboard"
}

// Navigation event with subtype (no element field)
{
  "type": "navigation",
  "subtype": "page_load",  // OR "route_change"
  "page": "/feedback/collect?testGroupId=abc123"
}
```

#### TypeScript & Compilation
- **Status**: Zero errors
- **Strict Mode**: Enabled
- **Type Coverage**: 100% of tracking modules

### In Progress ⏳

#### Manual Testing
- Verify ONE event per interaction (no click+navigation duplicates)
- Test rage click sends immediately (no stray click events)
- Test click suppression when navigation triggered (routeChangeStart cancels pending)
- Verify navigation events have correct subtype (page_load vs route_change)
- Verify dead click sends only ONE event (no duplicate click)
- Database check: events table includes subtype column

### Pending 📋

#### Page Exit Tracking
- Not yet implemented
- Required for session completion detection
- Plan: `beforeunload` + `visibilitychange` listeners

#### Session Duration Tracking
- Not yet implemented
- Needed for engagement metrics
- Plan: Track time on page + session start/end

#### Event Visualization / Dashboard
- Out of scope for v1
- Future enhancement for analytics insights

---

## 12. Technical Design Details

### Event Flow (Direct Sends + Coordination)

```plaintext
User clicks element
    ↓
[Rage Click Detected?]
├─ YES → cancelPendingClick() + sendEvent(rage_click)
│   └─ Return immediately (no dead-click check)
│
└─ NO → cancelPendingClick() (clear any prior interaction's timer)
    ↓
   [Interactive Element?]
    ├─ YES → Start dead-click monitoring (400ms)
    │       + Buffer click in pendingClickTimer (450ms)
    │   ├─ Dead fires at 400ms → cancelPendingClick() + send dead_click
    │   ├─ routeChangeStart fires → cancelPendingClick() (click suppressed)
    │   │   └─ routeChangeComplete → send navigation(route_change)
    │   └─ Timer fires at 450ms (nothing cancelled) → send click
    │
    └─ NO → sendEvent(click) immediately

Separately (NavigationTracker):
  Page load → sendNavigationEvent(page_load) immediately
  routeChangeStart → cancelPendingClick() (suppress buffered click)
  routeChangeComplete → sendNavigationEvent(route_change)
```

**Key Behavior:**
- Click + navigation on same element → only navigation (pending click cancelled)
- Click on unresponsive element → only dead_click (pending click cancelled)
- Non-interactive click → sent immediately (no timer, no dead check)
- Page reload → navigation(page_load) independently (no click competition)
- Rage click → sent immediately (pending click cancelled)

### Duplicate Prevention

| Scenario | Mechanism | Result |
|----------|-----------|--------|
| Click responsive button | 450ms timer completes, dead-click didn't fire | 1 click event |
| Click navigating link | routeChangeStart → cancelPendingClick() | 1 navigation event (click suppressed) |
| Rapid clicks (rage) | Rage detected → cancelPendingClick() → immediate send | 1 rage_click event |
| Click unresponsive element | Dead fires at 400ms → cancelPendingClick() | 1 dead_click event |
| Page reload | NavigationTracker sends page_load independently | 1 navigation event |
| SPA route change | routeChangeComplete with route comparison | 1 navigation event per distinct route |
| Back/forward button | previousRouteRef comparison | 1 navigation event if route differs |

### Why EventClassifier Was Removed

The shared-window approach caused 5 critical bugs:
1. **Navigation always won** — page_load entered window, any click within 400ms competed and lost
2. **Rage didn't clear timer** — immediate send worked but stray click fired at 400ms
3. **Dead click raced** — both fired at 400ms, dead arrived after click already sent
4. **Double navigation** — routeChangeComplete fired after window cleared, started new window
5. **Unrelated events competed** — page load and subsequent click shared same window

### Performance Characteristics

- **Memory**: Minimal (one ref per tracker component, short-lived event listeners)
- **CPU**: Negligible (only DOM mutations checked on interactive elements, 400ms window)
- **Network**: One fetch per event, batched keepalive (not blocking)
- **UI Impact**: None (all tracking async, no blocking operations)
- **Payload Size**: ~100-200 bytes per event (type + element + page)

---

## 13. Future Enhancements

* Event batching (reduce network calls)
* Session replay (reconstruct user journey)
* Advanced dead click heuristics (visibility, scroll position)
* Heatmap generation (visual UI friction)
* Event correlation (link feedback to specific interactions)
* Custom event types (form submission, video play, etc.)

---
