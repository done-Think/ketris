import type { Contact } from '../../domain/contact.entity'
import { ContactNotFoundError } from '../../domain/errors'
import type { ContactRepository } from '../ports/contact-repository.port'

export interface GetContactInput {
  actorTenantId: string
  contactId: string
}

export type GetContactOutput = Contact

export class GetContactUseCase {
  constructor(private readonly contactRepository: ContactRepository) {}

  async execute(input: GetContactInput): Promise<GetContactOutput> {
    const contact = await this.contactRepository.findById(input.contactId)

    if (!contact || contact.tenantId !== input.actorTenantId) {
      throw new ContactNotFoundError()
    }

    return contact
  }
}
