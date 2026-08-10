import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

import { authContainer } from '@server/auth/container'
import { InvalidCredentialsError } from '@server/auth/domain/errors'
import { platformContainer } from '@server/platform/container'
import { InvalidPlatformCredentialsError } from '@server/platform/domain/errors'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const { user, accessToken, refreshToken } = await authContainer.loginUseCase.execute({
            email: credentials.email,
            password: credentials.password,
          })

          return {
            id: user.id,
            name: user.nome,
            email: user.email,
            accessToken,
            refreshToken,
            scope: 'tenant',
            tenantId: user.tenantId,
            papel: user.papel,
          }
        } catch (error) {
          if (error instanceof InvalidCredentialsError) return null
          throw error
        }
      },
    }),
    CredentialsProvider({
      id: 'platform-credentials',
      name: 'platform-credentials',
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const { admin, accessToken, refreshToken } =
            await platformContainer.loginPlatformAdminUseCase.execute({
              email: credentials.email,
              password: credentials.password,
            })

          return {
            id: admin.id,
            name: admin.nome,
            email: admin.email,
            accessToken,
            refreshToken,
            scope: 'platform',
          }
        } catch (error) {
          if (error instanceof InvalidPlatformCredentialsError) return null
          throw error
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken
        token.refreshToken = user.refreshToken
        token.scope = user.scope
        token.tenantId = user.tenantId
        token.papel = user.papel
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.refreshToken = token.refreshToken
      session.scope = token.scope
      session.tenantId = token.tenantId
      session.papel = token.papel
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      return session
    },
  },
}
