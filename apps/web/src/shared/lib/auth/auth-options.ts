import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { httpClient } from '@shared/lib/api/http-client'

// Configuração do NextAuth. Autentica contra o backend próprio (JWT).
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
          const user = await httpClient.post<{
            id: string
            name: string
            email: string
            accessToken: string
            tenantId: string
          }>('/auth/login', {
            email: credentials.email,
            password: credentials.password,
          })

          return user
        } catch {
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as { accessToken: string }).accessToken
        token.tenantId = (user as { tenantId: string }).tenantId
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      session.tenantId = token.tenantId as string
      return session
    },
  },
}
