import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

import { authContainer } from '@server/auth/container'
import { InvalidCredentialsError } from '@server/auth/domain/errors'

export const authOptions: NextAuthOptions = {
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
            tenantId: user.tenantId,
            papel: user.papel,
          }
        } catch (error) {
          if (error instanceof InvalidCredentialsError) return null
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
        token.tenantId = user.tenantId
        token.papel = user.papel
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.refreshToken = token.refreshToken
      session.tenantId = token.tenantId
      session.papel = token.papel
      return session
    },
  },
}
