import type { UserRole } from '@server/auth/domain/user.entity'
import type { ContactListFilters } from '../application/ports/contact-repository.port'
import type { ContactListItem } from '../domain/contact.entity'
import type { CrmPage } from './pagination'

export interface ListContactsInput {
  actorTenantId: string
  actorId: string
  actorRole: UserRole
  filters?: ContactListFilters
}

export type ListContactsOutput = CrmPage<ContactListItem>
