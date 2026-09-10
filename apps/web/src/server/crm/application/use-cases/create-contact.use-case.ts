import type { Contact, NewContact } from '../../domain/contact.entity'
import { ContactEmailAlreadyExistsError } from '../../domain/errors'
import type { ContactRepository } from '../ports/contact-repository.port'

export interface CreateContactInput extends Omit<NewContact, 'tenantId'> {
  actorTenantId: string
}

export type CreateContactOutput = Contact

export class CreateContactUseCase {
  constructor(private readonly contactRepository: ContactRepository) {}

  async execute(input: CreateContactInput): Promise<CreateContactOutput> {
    const { actorTenantId, ...data } = input
    const email = data.email.trim().toLowerCase()

    // O banco tem unique (tenantId, email); checar antes troca um 500 de constraint por um 409 claro.
    const existing = await this.contactRepository.findByEmail(actorTenantId, email)

    if (existing) throw new ContactEmailAlreadyExistsError()

    return this.contactRepository.create({ ...data, email, tenantId: actorTenantId })
  }
}
