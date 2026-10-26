import type {
  UpdateContactInput,
  UpdateContactOutput,
} from '../../types/update-contact.use-case.types'
export type {
  UpdateContactInput,
  UpdateContactOutput,
} from '../../types/update-contact.use-case.types'

import { ContactEmailAlreadyExistsError, ContactNotFoundError } from '../../domain/errors'
import { assertAgentOwnsContact, assertCrmAccess } from '../authorization'
import type { ContactRepository } from '../ports/contact-repository.port'
import type { OpportunityRepository } from '../ports/opportunity-repository.port'

export class UpdateContactUseCase {
  constructor(
    private readonly contactRepository: ContactRepository,
    private readonly opportunityRepository: OpportunityRepository,
  ) {}

  async execute(input: UpdateContactInput): Promise<UpdateContactOutput> {
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

    const changes = { ...input.changes }

    if (changes.email) {
      changes.email = changes.email.trim().toLowerCase()

      if (changes.email !== contact.email) {
        const existing = await this.contactRepository.findByEmail(
          input.actorTenantId,
          changes.email,
        )

        if (existing) throw new ContactEmailAlreadyExistsError()
      }
    }

    const updated = await this.contactRepository.update(contact.id, changes)
    await this.opportunityRepository.syncContactDetails(input.actorTenantId, contact.id, updated)
    return updated
  }
}
