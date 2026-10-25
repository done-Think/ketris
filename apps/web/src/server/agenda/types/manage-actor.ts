import type { Papel } from '@server/auth/domain/user.entity'
export interface AgendaManageActor {
  actorTenantId: string
  actorUserId?: string
  actorPapel: Papel
}
