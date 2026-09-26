import type { Role } from './admin'

export interface TenantUser {
  id: string
  tenantId: string
  name: string
  email: string
  role: Role
  active: boolean
  pendingApproval: boolean
}
