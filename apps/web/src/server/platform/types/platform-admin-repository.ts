import type { PlatformAdminRole } from './platform-admin'

export interface NewPlatformAdmin {
  name: string
  email: string
  passwordHash: string
  role: PlatformAdminRole
}

export interface PlatformAdminUpdate {
  name?: string
  email?: string
  role?: PlatformAdminRole
  active?: true
}
