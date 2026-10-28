import type { UserRole } from '@server/auth/domain/user.entity'
export interface AgendaManageActor {
  actorTenantId: string
  actorUserId?: string
  actorRole: UserRole
}
