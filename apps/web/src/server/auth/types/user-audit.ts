export type UserAuditActor =
  | { kind: 'USER'; id: string }
  | { kind: 'PLATFORM_ADMIN'; id: string }
  | { kind: 'SELF_REGISTRATION' }
  | { kind: 'SYSTEM' }

export type UserAuditAction = 'CREATED' | 'UPDATED' | 'MEMBERSHIP_APPROVED' | 'DEACTIVATED'

export interface UserAuditInput {
  userId: string
  tenantId: string
  action: UserAuditAction
  actor?: UserAuditActor
  changedFields?: string[]
}
