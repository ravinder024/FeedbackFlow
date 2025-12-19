# Authentication & Authorization

This document outlines the authentication and authorization mechanisms used in FeedbackFlow, including user authentication, widget authentication, API authorization, and security best practices.

## 1. User Authentication

### Google OAuth Flow
FeedbackFlow uses [NextAuth.js](https://next-auth.js.org/) with Google OAuth for user authentication. The flow involves:
1. Redirecting users to Google's OAuth consent screen.
2. Exchanging the authorization code for user profile information.
3. Creating a session for the authenticated user.

Example configuration in `src/pages/api/auth/[...nextauth].ts`:
```typescript
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export default NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    callbacks: {
        async session({ session, user }) {
            session.userId = user.id;
            return session;
        },
    },
});
```

### Session Creation with NextAuth
NextAuth manages sessions using secure cookies. Upon successful login, a session is created and stored in the database.

### Cookie-Based Session Storage
Sessions are stored in cookies with the following flags:
- `httpOnly`: Prevents client-side JavaScript access.
- `secure`: Ensures cookies are only sent over HTTPS.
- `sameSite`: Protects against CSRF attacks.

## 2. Widget Authentication

### JWT Token Generation for Test Members
The widget uses short-lived JWT tokens for authentication. Tokens are generated on the server and signed with a secret key.

Example token generation:
```typescript
import jwt from "jsonwebtoken";

export function generateMemberToken(memberId: string): string {
    return jwt.sign({ memberId }, process.env.JWT_SECRET, { expiresIn: "15m" });
}
```

### Token Validation on Widget API Calls
Widget API endpoints validate tokens to ensure authenticity:
```typescript
import jwt from "jsonwebtoken";

export function validateToken(token: string): any {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        throw new Error("Invalid token");
    }
}
```

### Token Expiration and Refresh
Tokens expire after 15 minutes. Clients must request a new token when the current one expires.

## 3. API Authorization

### Role-Based Access Control (RBAC)
RBAC ensures users have the necessary permissions to access resources. The `src/lib/rbac.ts` module defines roles and permissions.

Example usage:
```typescript
import { checkPermissions } from "src/lib/rbac";

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);
    if (!checkPermissions(session.user, "admin")) {
        return res.status(403).json({ error: "Forbidden" });
    }
    // Proceed with the request
}
```

### Checking Permissions via `getServerSession`
API handlers use `getServerSession` to retrieve the user's session and validate their role.

### Handling Unauthorized Requests
Unauthorized requests return a `403 Forbidden` response.

## 4. Security Best Practices

- **Secure Cookie Flags**: Use `httpOnly`, `secure`, and `sameSite` attributes for cookies.
- **Token Encryption**: Sign JWT tokens with a strong secret key.
- **Session Timeout Handling**: Implement session expiration to reduce the risk of session hijacking.

## 5. Example Authentication Flows

### Dashboard Login Flow
1. User clicks "Login with Google."
2. Redirect to Google's OAuth consent screen.
3. On success, NextAuth creates a session and stores it in a secure cookie.

### Widget Token Exchange Flow
1. Server generates a JWT token for the test member.
2. Client includes the token in API requests.
3. Server validates the token before processing the request.

### API Request with Session Validation
1. Client sends a request with the session cookie.
2. Server retrieves the session using `getServerSession`.
3. Server checks permissions via `src/lib/rbac.ts`.

By following these practices, FeedbackFlow ensures secure and reliable authentication and authorization for both the dashboard and widget.