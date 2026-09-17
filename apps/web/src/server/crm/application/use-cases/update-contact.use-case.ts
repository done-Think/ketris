import type { Papel } from '@server/auth/domain/user.entity'

import type { Contact, ContactUpdate } from '../../domain/contact.entity'
import { ContactEmailAlreadyExistsError, ContactNotFoundError } from '../../domain/errors'
import { assertAgentOwnsContact } from '../authorization'
import type { ContactRepository } from '../ports/contact-repository.port'
import type { OpportunityRepository } from '../ports/opportunity-repository.port'

export interface UpdateContactInput {
  actorTenantId: string
  actorId: string
  actorPapel: Papel
  contactId: string
  changes: ContactUpdate
}

export type UpdateContactOutput = Contact

export class UpdateContactUseCase {
  constructor(
    private readonly contactRepository: ContactRepository,
    private readonly opportunityRepository: OpportunityRepository,
  ) {}

  async execute(input: UpdateContactInput): Promise<UpdateContactOutput> {
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

    return this.contactRepository.update(contact.id, changes)
  }
}
