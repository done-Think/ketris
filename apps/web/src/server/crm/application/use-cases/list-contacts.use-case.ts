import type {
  ListContactsInput,
  ListContactsOutput,
} from '../../types/list-contacts.use-case.types'
export type {
  ListContactsInput,
  ListContactsOutput,
} from '../../types/list-contacts.use-case.types'

import { assertCrmAccess } from '../authorization'
import type { ContactRepository } from '../ports/contact-repository.port'
import type { OpportunityRepository } from '../ports/opportunity-repository.port'

export class ListContactsUseCase {
  constructor(
    private readonly contactRepository: ContactRepository,
    private readonly opportunityRepository: OpportunityRepository,
  ) {}

  async execute(input: ListContactsInput): Promise<ListContactsOutput> {
    assertCrmAccess(input.actorPapel)
    const page = await this.contactRepository.findManyByTenant(input.actorTenantId, {
      ...input.filters,
      responsavelId: input.actorPapel === 'AGENT' ? input.actorId : undefined,
    })

    const contacts = page.items
    if (contacts.length === 0) return { ...page, items: [] }

    const counts = await this.opportunityRepository.countByContact(
      input.actorTenantId,
      contacts.map((contact) => contact.id),
    )

    return {
      ...page,
      items: contacts.map((contact) => ({
        ...contact,
        propertyCount: counts.get(contact.id) ?? 0,
      })),
    }
  }
}
