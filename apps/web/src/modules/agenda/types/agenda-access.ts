import type { Papel } from '@server/auth/domain/user.entity'

export interface AgendaActor {
  role?: Papel
  userId?: string
}
