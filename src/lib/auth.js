import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from './prisma';
import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react';

let loginSecuritySupportPromise;

async function getLoginSecurityColumnSupport() {
  if (!loginSecuritySupportPromise) {
    loginSecuritySupportPromise = prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'user'
        AND column_name IN ('failedLoginAttempts', 'lockedUntil')
    `.then((rows) => {
      const names = new Set(rows.map((row) => row.column_name));
      return {
        failedLoginAttempts: names.has('failedLoginAttempts'),
        lockedUntil: names.has('lockedUntil'),
      };
    }).catch(() => ({
      failedLoginAttempts: false,
      lockedUntil: false,
    }));
  }

  return loginSecuritySupportPromise;
}

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

        const email = credentials.email.trim().toLowerCase();
        const loginSecurityColumns = await getLoginSecurityColumnSupport();

        // Use findMany instead of findUnique since email is no longer globally unique
        // Email uniqueness is now scoped to organization
        const users = await prisma.user.findMany({
          where: {
            email,
            status: true,
          },
          select: {
            id: true,
            email: true,
            password: true,
            firstName: true,
            lastName: true,
            role: true,
            avatar: true,
            branchId: true,
            organizationId: true,
            status: true,
            ...(loginSecurityColumns.failedLoginAttempts
              ? { failedLoginAttempts: true }
              : {}),
            ...(loginSecurityColumns.lockedUntil ? { lockedUntil: true } : {}),
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

        if (loginSecurityColumns.lockedUntil && user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
          throw new Error('Account temporarily locked. Please try again later.');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid || !user.status) {
          if (loginSecurityColumns.failedLoginAttempts && loginSecurityColumns.lockedUntil) {
            const failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
            await prisma.user.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts,
                lockedUntil: failedLoginAttempts >= 5
                  ? new Date(Date.now() + 15 * 60 * 1000)
                  : user.lockedUntil,
              },
            });
          }
          throw new Error('Invalid credentials');
        }

        if (loginSecurityColumns.failedLoginAttempts && loginSecurityColumns.lockedUntil && (user.failedLoginAttempts || user.lockedUntil)) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: 0,
              lockedUntil: null,
            },
          });
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

export function getTrustedLoginIp(request) {
  const trustedIp =
    request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';

  return trustedIp;
}

export function getNormalizedLoginEmail(credentials) {
  const email = credentials?.email;
  if (typeof email !== 'string') {
    return '';
  }

  return email.trim().toLowerCase();
}

// Client-side hooks
export const signIn = nextAuthSignIn;
export const signOut = nextAuthSignOut;
export { useSession, getSession } from 'next-auth/react';

// Server-side config export
export default NextAuthConfig;
export const authOptions = NextAuthConfig;
