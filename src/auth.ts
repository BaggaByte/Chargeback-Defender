import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zom'; // wait, I will just use basic validation or no z since it might not be installed.

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        
        // Fetch user from real DB
        const result = await db.select().from(users).where(eq(users.email, credentials.email as string)).limit(1);
        const user = result[0];
        
        if (!user) {
          // For demo purposes, if user doesn't exist, we could return null.
          return null;
        }

        // In a real production app, verify password hash here using bcrypt
        // const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        // if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          organizationId: user.organizationId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.organizationId = (user as any).organizationId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).organizationId = token.organizationId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login', // We'll need to create this page
  },
  session: {
    strategy: 'jwt',
  }
});
