import type { UserAccessState } from '../types/user-access'

export type UserRole = 'OWNER' | 'AGENT' | 'RENTER' | 'PROPERTY_OWNER'

export type TenantMemberRole = Exclude<UserRole, 'RENTER'>

export interface User extends UserAccessState {
  id: string
  tenantId: string
  name: string
  email: string
  phone?: string | null
  creci?: string | null
  passwordHash: string
  avatarUrl?: string | null
  role: UserRole
  active: boolean
  membershipApprovedAt: Date | null
}
