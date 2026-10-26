import type { Papel } from '@server/auth/domain/user.entity'
import type { Contact } from '../domain/contact.entity'

export interface ArchiveContactInput {
  actorTenantId: string
  actorId: string
  actorPapel: Papel
  contactId: string
}

export type ArchiveContactOutput = Contact
