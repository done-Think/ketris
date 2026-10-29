export type PlatformAdminRole = 'ADMIN' | 'ADMIN_AGENT' | 'AGENT'

export interface PlatformAdmin {
  id: string
  name: string
  email: string
  passwordHash: string
  role: PlatformAdminRole
  active: boolean
  createdAt: Date
  lastAccessAt: Date | null
}

export type AuthenticatedPlatformAdmin = Omit<PlatformAdmin, 'passwordHash'>

export type PlatformAdminIdentity = Pick<PlatformAdmin, 'id' | 'name' | 'email' | 'role' | 'active'>

export interface AuthenticatedPlatformAdminResponse {
  id: string
  name: string
  email: string
  role: PlatformAdminRole
  active: boolean
  createdAt: string
  lastAccessAt: string | null
}
