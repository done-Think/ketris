import type {
  ArchiveContactInput,
  ArchiveContactOutput,
} from '../../types/archive-contact.use-case.types'
export type {
  ArchiveContactInput,
  ArchiveContactOutput,
} from '../../types/archive-contact.use-case.types'

import { ContactNotFoundError } from '../../domain/errors'
import { assertAgentOwnsContact, assertCrmAccess } from '../authorization'
import type { ContactRepository } from '../ports/contact-repository.port'
import type { OpportunityRepository } from '../ports/opportunity-repository.port'

export class ArchiveContactUseCase {
  constructor(
    private readonly contactRepository: ContactRepository,
    private readonly opportunityRepository: OpportunityRepository,
  ) {}

  async execute(input: ArchiveContactInput): Promise<ArchiveContactOutput> {
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

    return this.contactRepository.archive(contact.id)
  }
}
