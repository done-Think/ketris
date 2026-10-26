import type { Papel } from '@server/auth/domain/user.entity'

export interface ChargeReadActor {
  actorId: string
  actorTenantId: string
  actorPapel: Papel
}
