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
import type { LeadRepository } from '../ports/lead-repository.port'
import type { OpportunityRepository } from '../ports/opportunity-repository.port'

export class UpdateContactUseCase {
  constructor(
    private readonly contactRepository: ContactRepository,
    private readonly opportunityRepository: OpportunityRepository,
    private readonly leadRepository: LeadRepository,
  ) {}

  async execute(input: UpdateContactInput): Promise<UpdateContactOutput> {
    assertCrmAccess(input.actorRole)
    const contact = await this.contactRepository.findById(input.contactId)

    if (!contact || contact.tenantId !== input.actorTenantId) {
      throw new ContactNotFoundError()
    }

    await assertAgentOwnsContact(
      this.opportunityRepository,
      input.actorTenantId,
      contact.id,
      input.actorId,
      input.actorRole,
      contact.createdById,
      await this.contactRepository.hasLeadForAgent(input.actorTenantId, contact.id, input.actorId),
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
    await this.leadRepository.syncContactDetails(input.actorTenantId, contact.id, {
      ...(changes.name !== undefined ? { name: updated.name } : {}),
      ...(changes.email !== undefined ? { email: updated.email } : {}),
      ...(changes.phone !== undefined && updated.phone ? { phone: updated.phone } : {}),
    })
    return updated
  }
}
