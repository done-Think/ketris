import type { Contact, ContactUpdate } from '../../domain/contact.entity'
import { ContactEmailAlreadyExistsError, ContactNotFoundError } from '../../domain/errors'
import type { ContactRepository } from '../ports/contact-repository.port'

export interface UpdateContactInput {
  actorTenantId: string
  contactId: string
  changes: ContactUpdate
}

export type UpdateContactOutput = Contact

export class UpdateContactUseCase {
  constructor(private readonly contactRepository: ContactRepository) {}

  async execute(input: UpdateContactInput): Promise<UpdateContactOutput> {
    const contact = await this.contactRepository.findById(input.contactId)

    if (!contact || contact.tenantId !== input.actorTenantId) {
      throw new ContactNotFoundError()
    }

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
