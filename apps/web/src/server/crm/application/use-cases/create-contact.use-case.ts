import type {
  CreateContactInput,
  CreateContactOutput,
} from '../../types/create-contact.use-case.types'
export type {
  CreateContactInput,
  CreateContactOutput,
} from '../../types/create-contact.use-case.types'

import { ContactEmailAlreadyExistsError } from '../../domain/errors'
import { assertCrmAccess } from '../authorization'
import type { ContactRepository } from '../ports/contact-repository.port'

export class CreateContactUseCase {
  constructor(private readonly contactRepository: ContactRepository) {}

  async execute(input: CreateContactInput): Promise<CreateContactOutput> {
    const { actorTenantId, actorRole, ...data } = input
    assertCrmAccess(actorRole)
    const email = data.email.trim().toLowerCase()

    const existing = await this.contactRepository.findByEmail(actorTenantId, email)

    if (existing) throw new ContactEmailAlreadyExistsError()

    return this.contactRepository.create({
      name: data.name,
      phone: data.phone,
      type: data.type,
      avatarUrl: data.avatarUrl,
      notes: data.notes,
      email,
      tenantId: actorTenantId,
    })
  }
}
