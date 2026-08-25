import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { authConfig } from './auth.config';

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        // 🚨 DEMO FAST-PATH BYPASS 🚨
        // User requested to login without setting up PostgreSQL yet.
        // We bypass the DB entirely and return a mock session.
        if (credentials.email === 'admin@example.com' || credentials.email === 'operator@acme.com') {
          return {
            id: 'mock-user-123',
            email: credentials.email,
            name: credentials.email === 'admin@example.com' ? 'Admin Demo' : 'Operator Demo',
            role: credentials.email === 'admin@example.com' ? 'ADMIN' : 'OPERATOR',
            organizationId: 'mock-org-456',
          };
        }
        
        try {
          // Fetch user from real DB
          const result = await db.select().from(users).where(eq(users.email, credentials.email as string)).limit(1);
          const user = result[0];
          
          if (!user) return null;

          const isValid = await bcrypt.compare(credentials.password as string, user.passwordHash);
          if (!isValid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.fullName,
            role: user.role,
            organizationId: user.organizationId,
          };
        } catch (error) {
          console.error("Database connection failed during login:", error);
          return null; // DB is down
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  }
});
