import type { GetContactInput, GetContactOutput } from '../../types/get-contact.use-case.types'
export type { GetContactInput, GetContactOutput } from '../../types/get-contact.use-case.types'

import { ContactNotFoundError } from '../../domain/errors'
import { assertAgentOwnsContact, assertCrmAccess } from '../authorization'
import type { ContactRepository } from '../ports/contact-repository.port'
import type { OpportunityRepository } from '../ports/opportunity-repository.port'

export class GetContactUseCase {
  constructor(
    private readonly contactRepository: ContactRepository,
    private readonly opportunityRepository: OpportunityRepository,
  ) {}

  async execute(input: GetContactInput): Promise<GetContactOutput> {
    assertCrmAccess(input.actorPapel)
    const contact = await this.contactRepository.findById(input.contactId)

    if (!contact || contact.tenantId !== input.actorTenantId) {
      throw new ContactNotFoundError()
    }

    await assertAgentOwnsContact(
      this.opportunityRepository,
      input.actorTenantId,
      contact.id,
      input.actorId,
      input.actorPapel,
      contact.createdById,
    )

    return contact
  }
}
