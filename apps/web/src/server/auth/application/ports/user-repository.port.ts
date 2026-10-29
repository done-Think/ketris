import type { UserAuditActor } from '../../types/user-audit'
import type { UserRole, User } from '../../domain/user.entity'

export interface NewUser {
  auditActor?: UserAuditActor
  tenantId: string
  name: string
  email: string
  passwordHash: string
  role: UserRole
  phone?: string | null
  creci?: string | null
  termsAcceptedAt?: Date
  emailVerifiedAt?: Date | null
  membershipApprovedAt?: Date | null
}

export interface UserUpdate {
  auditActor?: UserAuditActor
  name?: string
  email?: string
  avatarUrl?: string | null
  role?: UserRole
  passwordHash?: string
  phone?: string | null
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
