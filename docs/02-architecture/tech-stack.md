# Technology Stack

FeedbackFlow is built using a modern and scalable technology stack, designed to support both a robust web application and an embeddable widget system. Below is a detailed breakdown of the stack and the rationale behind each choice.

## 1. Frontend
- **Next.js 13+ (pages router)**: Provides server-side rendering (SSR) and static site generation (SSG) for better performance and SEO. The pages router simplifies routing and file-based organization.
- **React 18**: Enables a component-based architecture and supports concurrent rendering for improved UI responsiveness.
- **TypeScript**: Ensures type safety and reduces runtime errors, improving developer productivity and code maintainability.
- **Tailwind CSS**: A utility-first CSS framework that accelerates styling and enforces design consistency.
- **React Testing Library + Jest**: Facilitates unit and integration testing of React components, ensuring reliability and correctness.

## 2. Backend
- **Next.js API routes**: Simplifies backend development by co-locating API endpoints with the frontend codebase. Supports serverless deployment.
- **Prisma ORM**: Provides a type-safe and developer-friendly way to interact with the PostgreSQL database. Simplifies database migrations and schema management.
- **PostgreSQL database**: A powerful, open-source relational database known for its reliability, scalability, and support for complex queries.
- **NextAuth.js (Google OAuth)**: Handles authentication and session management with built-in support for OAuth providers like Google.

## 3. Widget System
- **Webpack (UMD build)**: Bundles the widget as a Universal Module Definition (UMD) file, making it easy to embed in client websites regardless of their tech stack.
- **Standalone React bundle**: Ensures the widget is lightweight and independent, avoiding conflicts with the host website's dependencies.
- **External React/ReactDOM dependencies**: Reduces the widget's bundle size by relying on the host website to provide React and ReactDOM.

## 4. Infrastructure
- **Hosting**: TBD (e.g., Vercel for seamless Next.js deployment or AWS for greater flexibility and scalability).
- **Database**: PostgreSQL (managed service) for high availability, automated backups, and simplified maintenance.
- **CI/CD**: TBD (e.g., GitHub Actions for automated testing, building, and deployment workflows).

## 5. Development Tools
- **VS Code + GitHub Copilot**: Enhances developer productivity with intelligent code suggestions and a rich development environment.
- **Cursor AI for code generation**: Assists with boilerplate code and repetitive tasks, speeding up development.
- **Git for version control**: Tracks changes and facilitates collaboration among team members.
- **npm for package management**: Manages dependencies and scripts for building, testing, and running the application.

## 6. Key Libraries
- **DOM selector**: Libraries like `finder` or `optimal-select` are used for precise DOM element selection in the widget.
- **JWT**: `jsonwebtoken` is used for secure token generation and validation.
- **Email**: Libraries like `nodemailer` or `SendGrid` handle email notifications and communication.
- **Logging**: A custom `event-logger.ts` tracks user actions and system events for auditing and debugging.

### Why These Technologies?
The chosen stack balances modern development practices, scalability, and ease of use. Next.js and React provide a robust foundation for building dynamic web applications, while Prisma and PostgreSQL ensure reliable data management. The widget system's modular design allows for seamless integration into client websites, and the development tools streamline workflows and collaboration.
