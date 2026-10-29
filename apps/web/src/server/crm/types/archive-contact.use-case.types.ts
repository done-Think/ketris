import type { UserRole } from '@server/auth/domain/user.entity'
import type { Contact } from '../domain/contact.entity'

export interface ArchiveContactInput {
  actorTenantId: string
  actorId: string
  actorRole: UserRole
  contactId: string
}

export type ArchiveContactOutput = Contact
