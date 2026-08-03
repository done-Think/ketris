import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

import { authContainer } from '@server/auth/container'
import { InvalidCredentialsError } from '@server/auth/domain/errors'

// Configuração do NextAuth. Autentica chamando o LoginUseCase diretamente (in-process) — não faz um
// HTTP self-call para '/api/auth/login', já que ambos rodam no mesmo processo Next.js (ver ADR-0002).
// A rota /api/auth/login continua existindo separadamente para consumidores externos (mobile, Swagger).
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
          const { user, accessToken } = await authContainer.loginUseCase.execute({
            email: credentials.email,
            password: credentials.password,
          })

          return {
            id: user.id,
            name: user.nome,
            email: user.email,
            accessToken,
            tenantId: user.tenantId,
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
        token.tenantId = user.tenantId
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.tenantId = token.tenantId
      return session
    },
  },
}
