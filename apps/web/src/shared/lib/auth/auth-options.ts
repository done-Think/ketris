import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

import { authenticateUser, resolveTenantSlug } from '@/server/auth/auth.service'

// Configuração do NextAuth. As credenciais são validadas no BFF contra o Postgres via Prisma.
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null

        const host = typeof request.headers?.host === 'string' ? request.headers.host : undefined

        return authenticateUser({
          email: credentials.email,
          password: credentials.password,
          tenantSlug: resolveTenantSlug(host),
        })
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id
        token.tenantId = user.tenantId
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      session.tenantId = token.tenantId

      if (session.user) {
        session.user.id = token.userId
        session.user.role = token.role
      }

      return session
    },
  },
}
