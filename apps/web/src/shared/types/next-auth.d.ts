import 'next-auth'

declare module 'next-auth' {
  interface User {
    accessToken: string
    refreshToken: string
    tenantId: string
  }

  interface Session {
    accessToken?: string
    refreshToken?: string
    tenantId?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    tenantId?: string
  }
}
