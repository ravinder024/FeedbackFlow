import { NextApiHandler } from 'next';
import NextAuth, { NextAuthOptions, User, Session, Account, Profile } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/types/roles';

const THIRTY_MINUTES = 30 * 60; // 30 minutes in seconds
const THIRTY_MINUTES_MS = THIRTY_MINUTES * 1000; // 30 minutes in milliseconds

export const authOptions: NextAuthOptions = {
  debug: true, // Enable debug logging
  logger: {
    error(code, ...message) {
      console.error('🔴 AUTH ERROR:', code, ...message);
    },
    warn(code, ...message) {
      console.warn('🟡 AUTH WARNING:', code, ...message);
    },
    debug(code, ...message) {
      console.log('🔵 AUTH DEBUG:', code, ...message);
    },
  },
  jwt: {
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  useSecureCookies: false, // Allow non-HTTPS in development
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      id: 'credentials',
      name: 'Email & Password',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          console.log('🔑 AUTH ATTEMPT:', {
            email: credentials?.email,
            hasPassword: !!credentials?.password,
            timestamp: new Date().toISOString()
          });
          
          if (!credentials?.email || !credentials?.password) {
            console.error('❌ Missing credentials:', { 
              email: !!credentials?.email, 
              password: !!credentials?.password 
            });
            throw new Error('Email and password required');
          }

          // Test database connection
          try {
            await prisma.$connect();
            console.log('✅ Database connected');
            
            // Test query
            const dbTest = await prisma.$queryRaw`SELECT NOW();`;
            console.log('✅ Database query successful:', dbTest);
          } catch (dbError) {
            console.error('❌ Database error:', dbError);
            throw new Error('Database connection failed');
          }

          console.log('3. Looking up user...');
          // First check if user exists without password
          const userCheck = await prisma.user.findUnique({
            where: { email: credentials.email },
            select: { id: true }
          });

          console.log('👤 User exists check:', !!userCheck);

          if (!userCheck) {
            console.error('❌ User not found');
            throw new Error('Invalid email or password');
          }

          // If user exists, get full details
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            select: { 
              id: true, 
              name: true, 
              email: true, 
              role: true, 
              passwordHash: true,
              createdAt: true 
            }
          });

          console.log('4. User lookup result:', {
            found: !!user,
            hasHash: !!user?.passwordHash,
            role: user?.role,
            createdAt: user?.createdAt?.toISOString()
          });

          if (!user) {
            console.error('❌ User not found');
            throw new Error('Invalid email or password');
          }

          if (!user.passwordHash) {
            console.error('❌ User has no password hash');
            throw new Error('Invalid email or password');
          }

          console.log('5. Validating password...');
          const testHash = await bcrypt.hash('123456', 10);
          console.log('Debug - Password info:', {
            inputLength: credentials.password.length,
            storedHashLength: user.passwordHash.length,
            testHashLength: testHash.length,
            storedHashStart: user.passwordHash.substring(0, 7),
            testHashStart: testHash.substring(0, 7)
          });

          const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
          console.log('6. Password validation result:', isValid);
          
          if (!isValid) {
            console.error('❌ Password validation failed');
            throw new Error('Invalid email or password');
          }

          console.log('7. Authentication successful!');

          const authenticatedUser = {
            id: user.id,
            name: user.name ?? '',
            email: user.email,
            role: user.role as UserRole
          } satisfies User;

          console.log('Authentication successful, returning user:', authenticatedUser);
          return authenticatedUser as User;
        } catch (error) {
          console.error('Authorization error:', error);
          throw error;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.lastActivity = Date.now();
      } else if (token) {
        const lastActivity = token.lastActivity as number;
        if (Date.now() - lastActivity > THIRTY_MINUTES_MS) {
          token.error = 'SessionExpired';
        } else {
          token.lastActivity = Date.now();
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user && token) {
        try {
          if (token.error === 'SessionExpired') {
            return { ...session, expired: true };
          }
          
          session.user.id = token.id as string;
          session.user.role = token.role as UserRole;
          
          const expiryTime = new Date(Date.now() + THIRTY_MINUTES_MS);
          session.expires = expiryTime.toISOString();
          
          (session as any).lastActivity = token.lastActivity;
        } catch (error) {
          console.error('Session callback error:', error);
          return { ...session, expired: true };
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // If the URL is relative, we'll just redirect to it
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      // If this is the default sign-in success URL, redirect to test groups dashboard
      if (url === baseUrl || url.startsWith(`${baseUrl}/`)) {
        return `${baseUrl}/test-groups/dashboard`;
      }
      
      // Fallback to the base URL
      return baseUrl;
    }
  },
  events: {
    async createUser({ user }) {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: UserRole.TEST_MEMBER },
      });
    },
    async signIn({ user, account }) {
      if (!user.email) return;
      console.log('👋 Sign in event:', {
        user: user.email,
        account: account?.provider,
        timestamp: new Date().toISOString()
      });
    },
    async signOut({ token }) {
      console.log('👋 Sign out event:', {
        user: token?.email,
        timestamp: new Date().toISOString()
      });
    },
    async error(error: Error) {
      console.error('🔴 Auth error event:', error);
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: THIRTY_MINUTES, // 30 minutes
    updateAge: THIRTY_MINUTES / 2, // Update session every 15 minutes
  },
};

const authHandler: NextApiHandler = NextAuth(authOptions);

// Wrap the auth handler with error logging
import { withErrorLogging } from '@/middleware/error-logging';
export default withErrorLogging(authHandler); 