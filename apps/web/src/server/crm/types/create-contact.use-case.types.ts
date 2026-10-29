import type { UserRole } from '@server/auth/domain/user.entity'
import type { Contact, NewContact } from '../domain/contact.entity'

export interface CreateContactInput extends Omit<NewContact, 'tenantId'> {
  actorId?: string
  actorTenantId: string
  actorRole: UserRole
}

export type CreateContactOutput = Contact
