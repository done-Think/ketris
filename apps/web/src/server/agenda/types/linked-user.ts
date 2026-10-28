import type { UserRole } from '@server/auth/domain/user.entity'

export interface AgendaLinkedUserCandidate {
  id: string
  email: string
  tenantId: string
  role: UserRole
  active: boolean
  membershipApprovedAt: Date | null
}
