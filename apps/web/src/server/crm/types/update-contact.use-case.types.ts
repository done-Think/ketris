import type { UserRole } from '@server/auth/domain/user.entity'
import type { Contact, ContactUpdate } from '../domain/contact.entity'

export interface UpdateContactInput {
  actorTenantId: string
  actorId: string
  actorRole: UserRole
  contactId: string
  changes: ContactUpdate
}

export type UpdateContactOutput = Contact
