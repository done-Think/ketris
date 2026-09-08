import type { Contact } from '../../domain/contact.entity'
import { ContactNotFoundError } from '../../domain/errors'
import type { ContactRepository } from '../ports/contact-repository.port'

export interface ArchiveContactInput {
  actorTenantId: string
  contactId: string
}

export type ArchiveContactOutput = Contact

export class ArchiveContactUseCase {
  constructor(private readonly contactRepository: ContactRepository) {}

  async execute(input: ArchiveContactInput): Promise<ArchiveContactOutput> {
    const contact = await this.contactRepository.findById(input.contactId)

    if (!contact || contact.tenantId !== input.actorTenantId) {
      throw new ContactNotFoundError()
    }

    return this.contactRepository.archive(contact.id)
  }
}
