import type { Role } from './role'

export interface AuthQueryScope {
  tenantId?: string
  userId?: string
  role?: Role
}
