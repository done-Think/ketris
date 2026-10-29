import type { UserRole } from '@server/auth/domain/user.entity'
export interface AgendaReadActor {
  actorTenantId: string
  actorUserId: string
  actorRole: UserRole
}
