import type { Papel } from '@server/auth/domain/user.entity'
export interface AgendaReadActor {
  actorTenantId: string
  actorUserId: string
  actorPapel: Papel
}
