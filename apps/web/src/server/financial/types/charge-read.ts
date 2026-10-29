import type { UserRole } from '@server/auth/domain/user.entity'

export interface ChargeReadActor {
  actorId: string
  actorTenantId: string
  actorRole: UserRole
}
