import type { Papel } from '@server/auth/domain/user.entity'
import type { Contact, ContactUpdate } from '../domain/contact.entity'

export interface UpdateContactInput {
  actorTenantId: string
  actorId: string
  actorPapel: Papel
  contactId: string
  changes: ContactUpdate
}

export type UpdateContactOutput = Contact
