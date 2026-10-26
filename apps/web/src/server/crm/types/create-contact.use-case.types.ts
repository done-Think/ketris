import type { Papel } from '@server/auth/domain/user.entity'
import type { Contact, NewContact } from '../domain/contact.entity'

export interface CreateContactInput extends Omit<NewContact, 'tenantId'> {
  actorId?: string
  actorTenantId: string
  actorPapel: Papel
}

export type CreateContactOutput = Contact
