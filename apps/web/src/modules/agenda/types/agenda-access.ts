import type { UserRole } from '@shared/types/user-role'

export interface AgendaActor {
  role?: UserRole
  userId?: string
}
