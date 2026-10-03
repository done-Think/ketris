import type { Role } from './admin'

export interface TenantUser {
  id: string
  tenantId: string
  name: string
  email: string
  avatarUrl?: string | null
  role: Role
  active: boolean
  pendingApproval: boolean
}
