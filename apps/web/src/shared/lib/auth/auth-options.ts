import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import type { JWT } from 'next-auth/jwt'

import { authContainer } from '@server/auth/container'
import { AccountDeactivatedError, InvalidCredentialsError } from '@server/auth/domain/errors'
import { userRoleSchema } from '@server/auth/schemas/user.schema'
import { assertUserCanAuthenticate } from '@server/auth/domain/user-access-policy'
import { platformContainer } from '@server/platform/container'
import { InvalidPlatformCredentialsError } from '@server/platform/domain/errors'
import { isAuthenticationError } from '@server/security/authentication-errors'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
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
            name: user.name,
            email: user.email,
            image: user.avatarUrl ?? undefined,
            accessToken,
            refreshToken,
            scope: 'tenant',
            tenantId: user.tenantId,
            role: user.role,
            sessionVersion: user.sessionVersion ?? 0,
          }
        } catch (error) {
          if (
            error instanceof InvalidCredentialsError ||
            error instanceof AccountDeactivatedError
          ) {
            return null
          }
          throw error
        }
      },
    }),
    CredentialsProvider({
      id: 'token-session',
      name: 'token-session',
      credentials: {
        accessToken: { type: 'text' },
        refreshToken: { type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.accessToken || !credentials?.refreshToken) return null

        try {
          const payload = await authContainer.validateSessionTokensUseCase.execute(
            credentials.accessToken,
            credentials.refreshToken,
          )
          const user = await authContainer.userRepository.findById(payload.sub)

          if (!user || !user.active) return null

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.avatarUrl ?? undefined,
            accessToken: credentials.accessToken,
            refreshToken: credentials.refreshToken,
            scope: 'tenant',
            tenantId: user.tenantId,
            role: user.role,
            sessionVersion: payload.sessionVersion ?? 0,
          }
        } catch (error) {
          if (isAuthenticationError(error)) return null
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
            name: admin.name,
            email: admin.email,
            accessToken,
            refreshToken,
            scope: 'platform',
            platformRole: admin.role,
          }
        } catch (error) {
          if (error instanceof InvalidPlatformCredentialsError) return null
          throw error
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.accessToken = user.accessToken
        token.refreshToken = user.refreshToken
        token.scope = user.scope
        token.tenantId = user.tenantId
        token.role = user.role
        token.platformRole = user.platformRole
        token.sessionVersion = user.sessionVersion ?? 0
        delete token.authUnavailable
        delete token.pendingAccessToken
        delete token.pendingRefreshToken
        return token
      }

      if ('papel' in token) {
        const legacyRole = userRoleSchema.safeParse(token.papel)
        if (token.role === undefined && legacyRole.success) token.role = legacyRole.data
        delete token.papel
      }

      if (
        trigger === 'update' &&
        typeof session?.accessToken === 'string' &&
        session.accessToken &&
        typeof session?.refreshToken === 'string' &&
        session.refreshToken
      ) {
        token.pendingAccessToken = session.accessToken
        token.pendingRefreshToken = session.refreshToken
      }

      try {
        if (token.scope === 'tenant' && typeof token.sub === 'string') {
          const currentUser = await authContainer.userRepository.findById(token.sub)
          if (
            !currentUser ||
            currentUser.tenantId !== token.tenantId ||
            currentUser.role !== token.role ||
            !userRoleSchema.safeParse(token.role).success ||
            (currentUser.sessionVersion ?? 0) !== (token.sessionVersion ?? 0)
          )
            return clearSessionToken(token)
          assertUserCanAuthenticate(currentUser)
          token.name = currentUser.name
          token.email = currentUser.email
          token.picture = currentUser.avatarUrl
          await adoptValidatedSessionTokens(token)
        } else if (token.scope === 'platform' && typeof token.sub === 'string') {
          const admin = await platformContainer.platformAdminRepository.findById(token.sub)
          if (!admin?.active) return clearSessionToken(token)
          token.name = admin.name
          token.email = admin.email
          token.platformRole = admin.role
          await adoptValidatedSessionTokens(token)
        } else if (token.scope === 'tenant' || token.scope === 'platform') {
          return clearSessionToken(token)
        }
        delete token.authUnavailable
      } catch (error) {
        if (isAuthenticationError(error)) return clearSessionToken(token)
        token.authUnavailable = true
      }

      return token
    },
    async session({ session, token }) {
      session.authUnavailable = token.authUnavailable === true
      session.accessToken = token.authUnavailable ? undefined : token.accessToken
      session.refreshToken = token.authUnavailable ? undefined : token.refreshToken
      session.scope = token.authUnavailable ? undefined : token.scope
      session.tenantId = token.authUnavailable ? undefined : token.tenantId
      session.role = token.authUnavailable ? undefined : token.role
      session.platformRole = token.authUnavailable ? undefined : token.platformRole
      if (session.user && token.sub) {
        session.user.id = token.sub
        session.user.name = token.name
        session.user.email = token.email
        session.user.image = token.picture
      }
      return session
    },
  },
}

async function adoptValidatedSessionTokens(token: JWT): Promise<void> {
  if (!token.pendingAccessToken || !token.pendingRefreshToken) return
  try {
    if (token.scope === 'tenant') {
      const claims = await authContainer.validateSessionTokensUseCase.execute(
        token.pendingAccessToken,
        token.pendingRefreshToken,
      )
      if (
        claims.sub !== token.sub ||
        claims.tenantId !== token.tenantId ||
        claims.role !== token.role ||
        (claims.sessionVersion ?? 0) !== (token.sessionVersion ?? 0)
      ) {
        delete token.pendingAccessToken
        delete token.pendingRefreshToken
        return
      }
    } else if (token.scope === 'platform') {
      const claims = await platformContainer.validatePlatformSessionTokensUseCase.execute(
        token.pendingAccessToken,
        token.pendingRefreshToken,
      )
      if (claims.sub !== token.sub) {
        delete token.pendingAccessToken
        delete token.pendingRefreshToken
        return
      }
    } else return
    token.accessToken = token.pendingAccessToken
    token.refreshToken = token.pendingRefreshToken
  } catch (error) {
    if (!isAuthenticationError(error)) throw error
  }
  delete token.pendingAccessToken
  delete token.pendingRefreshToken
}

function clearSessionToken(token: JWT): JWT {
  delete token.authUnavailable
  delete token.pendingAccessToken
  delete token.pendingRefreshToken
  delete token.accessToken
  delete token.refreshToken
  delete token.scope
  delete token.tenantId
  delete token.role
  delete token.platformRole
  delete token.sessionVersion
  return token
}
