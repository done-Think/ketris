import type { Papel } from '@server/auth/domain/user.entity'

import type { ContactListItem } from '../../domain/contact.entity'
import type { ContactListFilters, ContactRepository } from '../ports/contact-repository.port'
import type { OpportunityRepository } from '../ports/opportunity-repository.port'

export interface ListContactsInput {
  actorTenantId: string
  actorId: string
  actorPapel: Papel
  filters?: ContactListFilters
}

export type ListContactsOutput = ContactListItem[]

export class ListContactsUseCase {
  constructor(
    private readonly contactRepository: ContactRepository,
    private readonly opportunityRepository: OpportunityRepository,
  ) {}

  async execute(input: ListContactsInput): Promise<ListContactsOutput> {
    const contacts = await this.contactRepository.findManyByTenant(input.actorTenantId, {
      ...input.filters,
      responsavelId: input.actorPapel === 'AGENT' ? input.actorId : undefined,
    })

    if (contacts.length === 0) return []

    // The CRM listing shows how many properties each contact has in negotiation. Resolved with a
    // single aggregation query, not one query per row.
    const counts = await this.opportunityRepository.countByContact(
      input.actorTenantId,
      contacts.map((contact) => contact.id),
    )

    return contacts.map((contact) => ({
      ...contact,
      propertyCount: counts.get(contact.id) ?? 0,
    }))
  }
}
