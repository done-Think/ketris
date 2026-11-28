import 'next-auth'

import type { DefaultSession } from 'next-auth'

import type { UserRole } from '@shared/types/user-role'
import type { PlatformAdminRole } from '@shared/types/user-role'

type SessionScope = 'tenant' | 'platform'
type TenantAccountType = 'INDIVIDUAL' | 'BROKER' | 'AGENCY'

declare module 'next-auth' {
  interface User {
    accessToken: string
    refreshToken: string
    scope: SessionScope
    tenantId?: string
    role?: UserRole
    accountType?: TenantAccountType
    platformRole?: PlatformAdminRole
    sessionVersion?: number
  }

  interface Session {
    authUnavailable?: boolean
    accessToken?: string
    refreshToken?: string
    scope?: SessionScope
    tenantId?: string
    role?: UserRole
    accountType?: TenantAccountType
    platformRole?: PlatformAdminRole
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
    role?: UserRole
    accountType?: TenantAccountType
    platformRole?: PlatformAdminRole
    sessionVersion?: number
  }
}
