# Pin Lifecycle: Data Flow

This document outlines the complete data flow for the lifecycle of pins in FeedbackFlow, from test session initiation to data retention. Pins are feedback points associated with DOM selectors, coordinates, and emotions, created by test members and managed by moderators.

---

## 1. Test Session Initiation

### Flow:
1. **Test Group Creation**: A moderator creates a test group, specifying the target domain.
2. **Invitation Acceptance**: Test members receive an invitation link and accept it.
3. **Session Start**: Upon acceptance, a short-lived JWT token (`memberToken`) is generated for the test member. This token is used for widget authentication.

---

## 2. Pin Creation Flow

### Flow:
1. **Widget Initialization**: 
    - The test member opens the widget on the target domain.
    - The widget injects click listeners into the iframe to capture user interactions.
2. **Element Selection**:
    - The user clicks on an element within the iframe.
    - The widget captures the DOM selector and coordinates of the clicked element.
3. **Feedback Submission**:
    - The user adds a comment and selects an emotion (e.g., happy, neutral, sad).
    - The widget sends a `POST` request to `/api/pins` with the following payload:
      ```json
      {
         "selector": "div#example",
         "coordinates": { "x": 100, "y": 200 },
         "comment": "This button is unclear.",
         "emotion": "neutral",
         "sessionId": "abc123"
      }
      ```
4. **Database Storage**:
    - The API validates the request, authenticates the user via `getServerSession`, and authorizes the action using `src/lib/rbac.ts`.
    - The pin is saved to the database with metadata (e.g., timestamp, session ID, user ID).

---

## 3. Pin Synchronization

### Flow:
1. **Observer Mode**:
    - Moderators or other test members fetch pins via a `GET` request to `/api/pins`.
    - The API returns a list of pins, including their coordinates, comments, and statuses.
2. **Overlay Rendering**:
    - The widget overlays pins at their saved coordinates on the target domain.
3. **Real-Time Updates**:
    - The widget periodically polls the `/api/pins` endpoint or listens for updates via WebSocket (if enabled).

---

## 4. Pin Resolution

### Flow:
1. **Resolution Action**:
    - A moderator marks a pin as resolved via a `PATCH` request to `/api/pins/:id` with the updated status:
      ```json
      {
         "status": "resolved"
      }
      ```
2. **Database Update**:
    - The API updates the pin's status in the database.
3. **Event Logging**:
    - The resolution action is recorded in the event log using `src/lib/event-logger.ts` for audit purposes.

---

## 5. Data Retention

### Policies:
1. **Pins**:
    - Pins are stored indefinitely (subject to future retention policies).
2. **Event Logs**:
    - System events: Retained for 365 days.
    - Authenticated user events: Retained for 90 days.
    - Anonymous user events: Retained for 30 days.

---

## Sequence Diagrams (Text Format)

### Pin Creation Flow:
```
Test Member       Widget       API Server       Database
     |                |              |               |
     | Open Widget    |              |               |
     |--------------->|              |               |
     |                | Inject Listeners            |
     |                |---------------------------->|
     | Click Element  |              |               |
     |--------------->|              |               |
     | Add Feedback   |              |               |
     |--------------->| POST /api/pins              |
     |                |---------------------------->|
     |                |              | Save Pin      |
     |                |              |-------------->|
     |                |              | Response      |
     |                |<----------------------------|
```

### Pin Resolution Flow:
```
Moderator         API Server       Database       Event Logger
     |                |               |               |
     | PATCH /api/pins/:id            |               |
     |---------------->|               |               |
     |                | Update Status |               |
     |                |-------------->|               |
     |                |               | Log Event     |
     |                |               |-------------->|
     |                | Response      |               |
     |<----------------|               |               |
```

---

This document provides a detailed overview of the pin lifecycle, ensuring clarity on data flow and integration points for developers.