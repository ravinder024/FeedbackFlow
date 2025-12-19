# FeedbackFlow Documentation

> **Last Updated:** 2025-12-19

## 📚 Documentation Index

### 1. Overview
- [Use Case & Value Proposition](./01-overview/use-case. md) - Problem statement, approach, results, and value

### 2. Architecture
- [System Overview](./02-architecture/overview. md) - High-level architecture diagram and component interaction
- [Data Flow](./02-architecture/data-flow.md) - Pin lifecycle and data movement through the system
- [Tech Stack](./02-architecture/tech-stack.md) - Technologies, libraries, and infrastructure

### 3. Product Requirements (PRDs)
- [Authentication & SSO](./03-prd/authentication.md) - Google OAuth integration and session management
- [User Management & Roles](./03-prd/user-management.md) - Admin/Moderator/Test Member hierarchy
- [Widget Foundation](./03-prd/widget-foundation. md) - Embeddable widget shell and iframe container
- [Visual Pin System](./03-prd/visual-pin-system.md) - DOM-based pin placement and feedback collection
- [Observer Mode](./03-prd/observer-mode. md) - Moderator consolidated feedback view
- [Privacy & Consent Layer](./03-prd/privacy-layer.md) - User consent and data masking
- [Database Integration](./03-prd/database-integration.md) - Pin persistence and data models
- [Admin Dashboard](./03-prd/admin-dashboard. md) - Feedback management and analytics
- [Email Notifications](./03-prd/email-notifications.md) - Email triggers and templates

### 4. API Documentation
- [Endpoints](./04-api/endpoints.md) - REST API reference
- [Authentication](./04-api/authentication.md) - JWT tokens and session handling

### 5. Testing
- [Testing Strategy](./05-testing/strategy.md) - Unit, integration, and E2E testing approach
- [Test Cases](./05-testing/test-cases.md) - Scenarios for critical workflows

### 6. MVP Scope
- [Capabilities & Limitations](./06-mvp/scope.md) - What's included and excluded from the MVP

### 7. Go-To-Market
- [GTM Strategy](./07-gtm/strategy.md) - ICP, pricing, beta testing, first 100 users

### 8. Security & Privacy
- [Security & Privacy Concerns](./08-security/privacy-concerns.md) - GDPR compliance, data handling, encryption

### 9. Troubleshooting
- [Common Issues & Fixes](./09-troubleshooting/common-issues.md) - Error codes and debugging guide

### 10. Progress Timeline
- [Implementation Timeline](./10-progress/timeline.md) - Features implemented, testing status, and CI/CD

---

## 🚀 Quick Start for Contributors

1. Review the [Use Case](./01-overview/use-case.md) to understand the problem we're solving
2. Check [System Overview](./02-architecture/overview.md) for architecture context
3. Pick a PRD from section 3 to understand specific features
4. Reference [API Endpoints](./04-api/endpoints.md) when building integrations

## 📝 Documentation Guidelines

- Keep language simple and accessible for non-technical stakeholders
- Include code examples where relevant
- Update the "Last Updated" date when making changes
- Cross-reference related documents using relative links