import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from './prisma';
import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react';

const NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        // Use findMany instead of findUnique since email is no longer globally unique
        // Email uniqueness is now scoped to organization
        const users = await prisma.user.findMany({
          where: {
            email: credentials.email,
            status: true,
          },
          include: {
            staff: true,
            client: true,
            branch: true,
          },
        });

        if (users.length === 0) {
          throw new Error('Invalid credentials');
        }

        // If more than one active user matches the email, fail closed
        // This prevents silent cross-tenant login ambiguity
        if (users.length > 1) {
          throw new Error('Multiple accounts exist for this email. Contact your administrator.');
        }

        const user = users[0];

        if (!user || !user.password) {
          throw new Error('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid || !user.status) {
          throw new Error('Invalid credentials');
        }

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatar: user.avatar,
          branchId: user.branchId,
          organizationId: user.organizationId
        };
      }
    })
  ],
  pages: {
    signIn: '/login',
    signOut: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.role = user.role;
        token.avatar = user.avatar;
        token.branchId = user.branchId;
        token.organizationId = user.organizationId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.role = token.role;
        session.user.avatar = token.avatar;
        session.user.branchId = token.branchId;
        session.user.organizationId = token.organizationId;
      }
      return session;
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours - HIPAA compliance
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Client-side hooks
export const signIn = nextAuthSignIn;
export const signOut = nextAuthSignOut;
export { useSession, getSession } from 'next-auth/react';

// Server-side config export
export default NextAuthConfig;
export const authOptions = NextAuthConfig;
