import 'next-auth'

import type { Papel } from '@server/auth/domain/user.entity'

type SessionScope = 'tenant' | 'platform'

declare module 'next-auth' {
  interface User {
    accessToken: string
    refreshToken: string
    scope: SessionScope
    tenantId?: string
    papel?: Papel
  }

  interface Session {
    accessToken?: string
    refreshToken?: string
    scope?: SessionScope
    tenantId?: string
    papel?: Papel
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    scope?: SessionScope
    tenantId?: string
    papel?: Papel
  }
}
