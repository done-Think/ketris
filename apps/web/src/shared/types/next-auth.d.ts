import 'next-auth'

import type { DefaultSession } from 'next-auth'

import type { Papel } from '@server/auth/domain/user.entity'

type SessionScope = 'tenant' | 'platform'

declare module 'next-auth' {
  interface User {
    accessToken: string
    refreshToken: string
    scope: SessionScope
    tenantId?: string
    role?: Papel
    sessionVersion?: number
  }

  interface Session {
    authUnavailable?: boolean
    accessToken?: string
    refreshToken?: string
    scope?: SessionScope
    tenantId?: string
    role?: Papel
    user: { id: string } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    authUnavailable?: boolean
    pendingAccessToken?: string
    pendingRefreshToken?: string
    accessToken?: string
    refreshToken?: string
    scope?: SessionScope
    tenantId?: string
    role?: Papel
    sessionVersion?: number
  }
}
