import type { UserAuditActor } from '../../types/user-audit'
import type { Papel, User } from '../../domain/user.entity'

export interface NewUser {
  auditActor?: UserAuditActor
  tenantId: string
  nome: string
  email: string
  senhaHash: string
  papel: Papel
  telefone?: string | null
  creci?: string | null
  termosAceitosEm?: Date
  emailVerifiedAt?: Date | null
  vinculoAprovadoEm?: Date | null
}

export interface UserUpdate {
  auditActor?: UserAuditActor
  nome?: string
  email?: string
  avatarUrl?: string | null
  papel?: Papel
  senhaHash?: string
  telefone?: string | null
  creci?: string | null
  tenantId?: string
}

export interface UserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string, tenantId?: string): Promise<User | null>
  findManyByEmail(email: string): Promise<User[]>
  findManyByTenant(tenantId: string): Promise<User[]>
  create(user: NewUser): Promise<User>
  update(id: string, changes: UserUpdate): Promise<User>
  deactivate(id: string, tenantId?: string, actor?: UserAuditActor): Promise<User>
  approveMembership(id: string, tenantId?: string, actor?: UserAuditActor): Promise<User>
}
