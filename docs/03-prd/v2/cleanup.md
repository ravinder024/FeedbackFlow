# PRD: FeedbackFlow v2 Cleanup

## 1. Feature Name

V2 Foundation Cleanup

---

## 2. Objective

Prepare the existing FeedbackFlow system for transition from a **visual pin-based feedback system** to a **behavior-driven issue detection system**.

This phase focuses on removing obsolete components and ensuring a clean, stable base for future development.

---

## 3. Scope

### In Scope

* Removal of Visual Pin System
* Removal of screenshot-based workflows
* Backend cleanup of pin-related models and APIs
* UI cleanup of pin-related components
* Minimal widget refactor (remove pin logic)
* Introduction of base Event schema (no logic yet)

### Out of Scope

* Event tracking implementation
* Feedback collection redesign
* AI processing
* Issue clustering or dashboards

---

## 4. Components to Remove

* Pin placement UI
* Pin-related APIs
* Screenshot capture workflows
* Pin database models
* Observer Mode (pin-based logic only)

---

## 5. Components to Retain

* Authentication (OAuth/session management)
* User roles (Admin, Moderator, Member)
* Test Groups
* Database (Prisma/PostgreSQL setup)
* Widget loader (simplified)
* Admin dashboard (basic functionality)

---

## 6. Technical Requirements

### Backend

* Remove pin-related schema and queries
* Add base Event model:

Fields:

* id
* type
* element
* page
* timestamp

---

### Frontend

* Remove pin UI elements
* Ensure no broken navigation
* Widget should load without interaction logic

---

### Widget

* Must load via script on external site
* No pin interaction logic
* No UI clutter

---

## 7. Success Criteria

* No pin-related code remains in system
* Application runs without errors
* Authentication and user flows work
* Test group creation works
* Widget loads successfully on target website

---

## 8. Risks & Considerations

* Hidden dependencies on pin logic may break flows
* Database migrations may cause inconsistencies
* UI components may rely on removed APIs

Mitigation:

* Remove incrementally
* Test after each deletion/refactor
* Maintain backup branch

---

## 9. Exit Criteria

* Clean codebase with no pin references
* Stable application build
* Ready for Part 1: Event Tracking Engine

---
