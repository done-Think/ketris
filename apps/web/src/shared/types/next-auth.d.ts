import 'next-auth'

export type KetrisUserRole = 'ADMIN' | 'PROPRIETARIO' | 'CORRETOR'

declare module 'next-auth' {
  interface User {
    tenantId: string
    role: KetrisUserRole
  }

  interface Session {
    tenantId?: string
    user?: {
      id?: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: KetrisUserRole
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string
    tenantId?: string
    role?: KetrisUserRole
  }
}
