import type { UserRole } from '@server/auth/domain/user.entity'

export interface PropertyOwnerContactScope {
  actorTenantId: string
  actorId: string
  actorRole: UserRole
  contactId: string
}

export interface PropertyOwnerContactDirectory {
  findAvailableContact(
    scope: PropertyOwnerContactScope,
  ): Promise<{ id: string; name: string } | null>
}
