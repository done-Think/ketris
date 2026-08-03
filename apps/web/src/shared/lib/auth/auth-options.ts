import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

import { httpClient } from '@shared/lib/api/http-client'

type LoginResponse = {
  id: string
  name: string
  email: string
  accessToken: string
  tenantId: string
}

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
          return await httpClient.post<LoginResponse>('/auth/login', {
            email: credentials.email,
            password: credentials.password,
          })
        } catch {
          return null
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
